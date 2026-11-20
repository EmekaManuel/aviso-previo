import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';
import { CUSTOMER_DPAS } from '../data/seedData';
import { runSeedStep, SeedStep } from '../seed/seedEngine';
import { assessIssue } from '../assessment/assessIssue';
import { createOrFetchLegalRequest } from '../legal/legalRequest';
import { loadRegister, loadVendors, saveDpa } from '../storage/register';
import { getPageText } from '../confluence/pages';
import { getGraphStatus, syncContractsToGraph } from '../graph/contractGraph';
import { extractDPATerms, ExtractedDPATerms } from '../extraction/extractor';
import { scoreContract } from '../evaluation/scoring';
import type { DpaRecord } from '../types';

const resolver = new Resolver();

/** Who is acting. Forge supplies the account id; it is recorded with every counsel decision. */
const actor = (req: any): string => (req?.context?.accountId ? `Counsel (${req.context.accountId})` : 'Counsel');

/**
 * Issue panel: the assessment for the ticket being viewed. The same function
 * backs the workflow validator, so the panel and the release hold agree.
 */
resolver.define('getIssueAssessment', async (req) => {
  const issueKey = req.context?.extension?.issue?.key;
  if (!issueKey) throw new Error('This view is not on a Jira issue.');
  return assessIssue(issueKey);
});

/**
 * Reads the ticket again and classifies it afresh (for when its text changed, or an earlier
 * reading was wrong). A counsel override and a linked privacy request are kept, and so is
 * the notice clock if a hold had already started.
 */
resolver.define('reassessIssue', async (req) => {
  const issueKey = req.context?.extension?.issue?.key;
  if (!issueKey) throw new Error('This view is not on a Jira issue.');
  const old = (await kvs.get(`decision:${issueKey}`)) as any;
  await kvs.delete(`decision:${issueKey}`);
  const fresh = await assessIssue(issueKey);
  if (old) {
    const keep: Record<string, unknown> = {};
    for (const k of ['overridden', 'overriddenBy', 'overrideReason', 'overriddenAt', 'legalRequestKey']) if (old[k] !== undefined) keep[k] = old[k];
    const held = old.classification === 'NEW_SUBPROCESSOR' || old.classification === 'LOCATION_CHANGE';
    if (old.noticeStartedAt && held && (fresh.classification === 'NEW_SUBPROCESSOR' || fresh.classification === 'LOCATION_CHANGE')) {
      keep.noticeStartedAt = old.noticeStartedAt;
    }
    if (Object.keys(keep).length) {
      const stored = (await kvs.get(`decision:${issueKey}`)) as any;
      await kvs.set(`decision:${issueKey}`, { ...stored, ...keep });
      return assessIssue(issueKey);
    }
  }
  return fresh;
});

/** Opens (or returns) the privacy request for the ticket. */
resolver.define('createLegalNoticeRequest', async (req) => {
  const { issueKey } = req.payload as { issueKey: string };
  return createOrFetchLegalRequest(issueKey);
});

/** Counsel override of a release hold. The reason and who made it are recorded. */
resolver.define('overrideIssueDecision', async (req) => {
  const { issueKey, overrideReason } = req.payload as { issueKey: string; overrideReason: string };
  const reason = (overrideReason || '').trim();
  if (!reason) throw new Error('An override needs a written reason.');
  // Make sure the ticket has a stored decision before it is overridden.
  await assessIssue(issueKey);
  const decision: any = (await kvs.get(`decision:${issueKey}`)) || {};
  const updated = {
    ...decision,
    overridden: true,
    overriddenBy: actor(req),
    overrideReason: reason,
    overriddenAt: new Date().toISOString(),
  };
  await kvs.set(`decision:${issueKey}`, updated);
  return { success: true, overriddenBy: updated.overriddenBy };
});

/** Admin: one step of loading the sample company (storage, Jira, then Confluence in batches). */
resolver.define('seedStep', async (req) => {
  const { step, offset } = req.payload as { step: SeedStep; offset?: number };
  const result = await runSeedStep(step, offset ?? 0);
  if (result.done && step === 'confluence') await syncContractsToGraph().catch(() => null);
  return result;
});

/** Admin: the register as it stands. */
resolver.define('getAdminState', async () => {
  const [dpas, vendors] = await Promise.all([loadRegister(), loadVendors()]);
  const confirmedCount = dpas.filter((d) => d.status === 'confirmed').length;
  const unclearCount = dpas.filter((d) => d.status === 'unclear' || (d.status !== 'confirmed' && d.noticeUnit === 'unclear')).length;
  return { dpaCount: dpas.length, vendorCount: vendors.length, confirmedCount, unclearCount, dpas, vendors };
});

/** Counsel confirms one contract's terms as read. */
resolver.define('confirmDPA', async (req) => {
  const { dpaId } = req.payload as { dpaId: string };
  const dpa = (await kvs.get(`dpa:${dpaId}`)) as DpaRecord | undefined;
  if (!dpa) throw new Error(`No contract ${dpaId}.`);
  if (dpa.status === 'unclear' || dpa.noticeUnit === 'unclear') {
    throw new Error('This clause is ambiguous. Resolve it with a notice period before confirming.');
  }
  await saveDpa({ ...dpa, status: 'confirmed', confirmedAt: new Date().toISOString(), confirmedBy: actor(req) });
  await syncContractsToGraph().catch(() => null);
  return { success: true, dpaId };
});

/** Counsel confirms every contract that has a stated notice period. */
resolver.define('confirmAllDPAs', async (req) => {
  const dpas = await loadRegister();
  let confirmedCount = 0;
  for (const dpa of dpas) {
    if (dpa.status !== 'confirmed' && dpa.noticeUnit !== 'unclear' && dpa.status !== 'unclear') {
      await saveDpa({ ...dpa, status: 'confirmed', confirmedAt: new Date().toISOString(), confirmedBy: actor(req) });
      confirmedCount++;
    }
  }
  await syncContractsToGraph().catch(() => null);
  return { success: true, confirmedCount };
});

/** Counsel decides an ambiguous clause by entering the notice period they read into it. */
resolver.define('resolveDPA', async (req) => {
  const { dpaId, noticePeriodDays, noticeUnit } = req.payload as {
    dpaId: string;
    noticePeriodDays: number;
    noticeUnit: 'calendar_days' | 'business_days';
  };
  const days = Math.round(Number(noticePeriodDays));
  if (!Number.isFinite(days) || days < 1 || days > 365) throw new Error('Enter a notice period between 1 and 365 days.');
  if (noticeUnit !== 'calendar_days' && noticeUnit !== 'business_days') throw new Error('Choose calendar or business days.');
  const dpa = (await kvs.get(`dpa:${dpaId}`)) as DpaRecord | undefined;
  if (!dpa) throw new Error(`No contract ${dpaId}.`);
  await saveDpa({
    ...dpa,
    noticePeriodDays: days,
    noticeUnit,
    status: 'confirmed',
    resolvedByCounsel: true,
    confirmedAt: new Date().toISOString(),
    confirmedBy: actor(req),
  });
  await syncContractsToGraph().catch(() => null);
  return { success: true, dpaId };
});

/** Reads one contract back from its Confluence page with the model and compares it with the register. */
resolver.define('extractContract', async (req) => {
  const { dpaId } = req.payload as { dpaId: string };
  const dpa = (await kvs.get(`dpa:${dpaId}`)) as DpaRecord | undefined;
  if (!dpa) throw new Error(`No contract ${dpaId}.`);
  if (!dpa.confluencePageId) throw new Error('This contract has no Confluence page yet. Load the sample data again.');

  const text = await getPageText(dpa.confluencePageId);
  const extracted = await extractDPATerms(text, dpa.id, dpa.customerName);
  if (extracted.error) throw new Error(`The model could not read this contract: ${extracted.error}`);

  await kvs.set(`extract:${dpa.id}`, extracted);
  const unclear = extracted.isUnclear || extracted.noticeUnit === 'unclear';
  return {
    extracted: {
      noticePeriodDays: extracted.noticePeriodDays,
      noticeUnit: extracted.noticeUnit,
      objectionWindowDays: extracted.objectionWindowDays,
      remedy: extracted.remedy,
      locationRestriction: extracted.locationRestriction,
      exactClause: extracted.exactClause,
      clauseVerified: extracted.clauseVerified,
      unclear,
    },
    matches: {
      notice: unclear ? dpa.noticeUnit === 'unclear' : extracted.noticePeriodDays === dpa.noticePeriodDays,
      unit: extracted.noticeUnit === dpa.noticeUnit,
      remedy: extracted.remedy === dpa.remedy,
      location: extracted.locationRestriction === dpa.locationRestriction,
    },
  };
});

/** Replaces the register's terms with what the model read, and puts them back in front of counsel. */
resolver.define('applyExtraction', async (req) => {
  const { dpaId } = req.payload as { dpaId: string };
  const dpa = (await kvs.get(`dpa:${dpaId}`)) as DpaRecord | undefined;
  const extracted = (await kvs.get(`extract:${dpaId}`)) as ExtractedDPATerms | undefined;
  if (!dpa || !extracted) throw new Error('Check this contract against Confluence first.');
  const unclear = extracted.isUnclear || extracted.noticeUnit === 'unclear';
  await saveDpa({
    ...dpa,
    noticePeriodDays: unclear ? null : extracted.noticePeriodDays,
    noticeUnit: unclear ? 'unclear' : extracted.noticeUnit,
    objectionWindowDays: extracted.objectionWindowDays,
    remedy: extracted.remedy,
    locationRestriction: extracted.locationRestriction,
    exactClause: extracted.clauseVerified ? extracted.exactClause : dpa.exactClause,
    status: unclear ? 'unclear' : 'draft',
    confirmedAt: null,
    confirmedBy: null,
    resolvedByCounsel: false,
  });
  await syncContractsToGraph().catch(() => null);
  return { success: true, status: unclear ? 'unclear' : 'draft' };
});

/**
 * Evaluation: the model reads contracts from their Confluence pages and every
 * answer is scored against the hand-written labels. The admin page calls this a
 * few contracts at a time and adds the rows up.
 */
resolver.define('runExtractionEvaluation', async (req) => {
  const { offset = 0, size = 4 } = (req.payload || {}) as { offset?: number; size?: number };
  const batch = CUSTOMER_DPAS.slice(offset, offset + size);

  const rows = await Promise.all(
    batch.map(async (label) => {
      const record = (await kvs.get(`dpa:${label.id}`)) as DpaRecord | undefined;
      if (!record?.confluencePageId) {
        return { id: label.id, customerName: label.customerName, error: 'No Confluence page. Load the sample data again.' };
      }
      try {
        const text = await getPageText(record.confluencePageId);
        const got = await extractDPATerms(text, label.id, label.customerName);
        return scoreContract(label, got, text);
      } catch (err: any) {
        return { id: label.id, customerName: label.customerName, error: err.message || 'Failed' };
      }
    })
  );

  return { rows, total: CUSTOMER_DPAS.length, nextOffset: offset + batch.length, done: offset + batch.length >= CUSTOMER_DPAS.length };
});

/** Teamwork Graph: is the connector connected, and how did the last sync go? */
resolver.define('getGraphStatus', async () => getGraphStatus());

/** Pushes the register to the Teamwork Graph now. */
resolver.define('syncGraph', async () => {
  const status = await syncContractsToGraph();
  if (!status) throw new Error('Not connected yet. Connect it under Apps > Connected apps > Aviso Previo.');
  return status;
});

export const handler = resolver.getDefinitions();
