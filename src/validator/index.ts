import api, { route } from '@forge/api';
import { assessIssue, IssueAssessment } from '../assessment/assessIssue';

export interface ValidatorPayload {
  issue: { id?: string; key: string; fields?: { summary?: string; status?: { name: string } } };
  transition?: {
    id?: string;
    name?: string;
    to?: { id?: string; name?: string; statusCategory?: { key?: string } };
  };
}

export interface ValidatorResult {
  result: boolean;
  errorMessage?: string;
}

/** Statuses that put code in front of customers. Moving work along earlier is always allowed. */
const RELEASE_STATUS = /\b(done|deployed|deploy|released?|production|live|closed|resolved)\b/i;

interface Target { name?: string; category?: string }

/** What the payload says about where the issue is going, whatever shape Jira sends. */
function targetFromPayload(payload: ValidatorPayload): Target {
  const t: any = payload.transition ?? {};
  return {
    name: t.to?.name ?? t.toStatus?.name ?? t.destination?.name ?? t.name,
    category: t.to?.statusCategory?.key ?? t.toStatus?.statusCategory?.key,
  };
}

/**
 * The payload does not always carry the target status, so when it does not, ask Jira
 * which status this transition id leads to. Returns an empty target if that fails.
 */
async function resolveTarget(payload: ValidatorPayload): Promise<Target> {
  const fromPayload = targetFromPayload(payload);
  if (fromPayload.name || fromPayload.category) return fromPayload;
  const id = (payload.transition as any)?.id;
  const key = payload.issue?.key;
  if (!id || !key) return {};
  try {
    const res = await api.asApp().requestJira(route`/rest/api/3/issue/${key}/transitions`);
    if (!res.ok) return {};
    const match = ((await res.json()).transitions ?? []).find((x: any) => String(x.id) === String(id));
    return { name: match?.to?.name ?? match?.name, category: match?.to?.statusCategory?.key };
  } catch {
    return {};
  }
}

/**
 * A transition is only waved through when we can positively say it is not a release.
 * If the target cannot be identified at all, treat it as a release: fail closed.
 */
export function isReleaseTarget(target: Target): boolean {
  if (target.category === 'done') return true;
  if (!target.name) return true;
  return RELEASE_STATUS.test(target.name);
}

/** Kept for callers that only have the payload (no Jira lookup). */
export function isReleaseTransition(payload: ValidatorPayload): boolean {
  return isReleaseTarget(targetFromPayload(payload));
}

export function holdMessage(a: IssueAssessment): string {
  const note =
    a.basis.pending + a.basis.unclear > 0
      ? ` ${a.basis.pending + a.basis.unclear} contract(s) are still awaiting counsel review, so the date may move later.`
      : '';
  if (a.failClosedReason) {
    return `Aviso Previo release hold: ${a.issueKey} cannot be released yet. ${a.failClosedReason}`;
  }
  const what =
    a.classification === 'NEW_SUBPROCESSOR'
      ? `introduces new subprocessor "${a.vendor ?? 'unnamed vendor'}". ${a.affectedCustomers} customer DPA(s) require prior notice (longest: ${a.longestNoticeDays} days)`
      : `moves subprocessor "${a.vendor ?? 'unnamed vendor'}" outside the EU/UK, which ${a.affectedCustomers} customer DPA(s) forbid`;
  return `Aviso Previo release hold: ${a.issueKey} ${what}. Earliest permitted deployment: ${a.earliestGoLiveDate}.${note}${a.legalRequestKey ? ` Privacy request: ${a.legalRequestKey}.` : ''}`;
}

/**
 * Jira workflow validator. Blocks a release-type transition while the customer
 * notice window for the ticket is open. Everything comes from the same
 * assessment the issue panel shows: there are no ticket-specific branches.
 * If the ticket cannot be assessed, the transition is blocked.
 */
export async function validateTransition(payload: ValidatorPayload): Promise<ValidatorResult> {
  const issueKey = payload?.issue?.key || '';
  const target = await resolveTarget(payload);
  const label = target.name ?? `(unknown, transition ${JSON.stringify(payload?.transition ?? null)})`;
  if (!isReleaseTarget(target)) {
    console.log(`[Aviso Previo] ${issueKey} -> "${label}": not a release transition, allowed`);
    return { result: true };
  }

  try {
    const a = await assessIssue(issueKey);
    if (a.overridden) {
      console.log(`[Aviso Previo] ${issueKey} released by counsel override: ${a.overrideReason}`);
      return { result: true };
    }
    // A ticket called "synthetic data only" is only released once a person has confirmed it:
    // a wrong "synthetic" is the one mistake that would let real customer data through unnoticed.
    if (a.classification === 'NO_CUSTOMER_DATA' && !a.syntheticConfirmed) {
      console.log(`[Aviso Previo] ${issueKey} -> "${label}": synthetic data not yet confirmed, BLOCKED`);
      return {
        result: false,
        errorMessage: `Aviso Previo: ${issueKey} mentions ${a.vendor ?? 'a third-party tool'} but is described as using synthetic data only. Open the Aviso Previo panel and confirm that no customer personal data is involved before releasing.`,
      };
    }
    const block = a.holdApplies && a.holdActive;
    console.log(`[Aviso Previo] ${issueKey} -> "${label}": ${a.classification}, hold applies=${a.holdApplies}, active=${a.holdActive}, ${block ? 'BLOCKED' : 'allowed'}`);
    if (block) return { result: false, errorMessage: holdMessage(a) };
    return { result: true };
  } catch (error: any) {
    console.error(`Workflow validator error on ${issueKey}:`, error);
    return {
      result: false,
      errorMessage: `Aviso Previo: Unable to verify subprocessor notice commitments on ${issueKey}. ${error?.message ?? ''}`.trim(),
    };
  }
}
