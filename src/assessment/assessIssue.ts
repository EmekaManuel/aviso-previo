import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import type { HostingRegion } from '../types';
import { classifyTicket, isValidClassification, TicketClassification } from '../classification/ticketClassifier';
import { evaluateHold, HoldBasis, parseHostingRegion } from '../engine/holdPolicy';
import { generateDraftCustomerNotice } from '../legal/draftNotice';
import { loadRegister, loadVendors } from '../storage/register';

/** What is stored per ticket (Forge KVS `decision:{issueKey}`). Numbers are NOT stored: they are recomputed from the register. */
export interface DecisionRecord {
  issueKey: string;
  classification: TicketClassification;
  vendor: string | null;
  purpose: string;
  hostingRegion: HostingRegion;
  aiReason: string;
  /** When the notice clock started: the first time this ticket was assessed. */
  noticeStartedAt: string;
  legalRequestKey?: string;
  overridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
  overriddenAt?: string;
}

export interface IssueAssessment {
  issueKey: string;
  classification: TicketClassification;
  vendor: string | null;
  purpose: string;
  hostingRegion: HostingRegion;
  aiReason: string;
  noticeStartedAt: string;
  holdApplies: boolean;
  holdActive: boolean;
  failClosedReason?: string;
  earliestGoLiveDate: string;
  earliestGoLiveISO: string;
  longestNoticeDays: number;
  affectedCustomers: number;
  terminationRightsCount: number;
  terminationCustomers: string[];
  locationConflictsCount: number;
  conflictingCustomers: string[];
  basis: HoldBasis;
  sampleClauseCustomer?: string;
  sampleClauseQuote?: string;
  legalRequestKey?: string;
  draftNotice: { subject: string; body: string } | null;
  overridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
}

/** Atlassian Document Format to plain text. */
export function adfToText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return node.text ?? '';
  const inner = Array.isArray(node.content) ? node.content.map(adfToText).join(node.type === 'doc' ? '\n' : '') : '';
  return ['paragraph', 'heading', 'listItem'].includes(node.type) ? inner + '\n' : inner;
}

async function fetchIssueText(issueKey: string): Promise<{ summary: string; description: string }> {
  const res = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=summary,description`);
  if (!res.ok) throw new Error(`Could not read ${issueKey} from Jira (HTTP ${res.status}).`);
  const data = await res.json();
  return { summary: data.fields?.summary ?? '', description: adfToText(data.fields?.description).trim() };
}

/** Loads the stored decision, or reads the ticket, classifies it and stores the decision. */
async function loadOrCreateDecision(issueKey: string, now: Date): Promise<DecisionRecord> {
  const stored = (await kvs.get(`decision:${issueKey}`)) as any;
  if (stored && isValidClassification(stored.classification)) {
    const region: HostingRegion =
      stored.hostingRegion ??
      (stored.classification === 'LOCATION_CHANGE' ? 'OUTSIDE_EU_UK' : parseHostingRegion(stored.vendorLocation || stored.targetLocation));
    const decision: DecisionRecord = {
      issueKey,
      classification: stored.classification,
      vendor: stored.vendor ?? null,
      purpose: stored.purpose ?? '',
      hostingRegion: region,
      aiReason: stored.aiReason ?? '',
      noticeStartedAt: stored.noticeStartedAt ?? now.toISOString(),
      legalRequestKey: stored.legalRequestKey,
      overridden: stored.overridden,
      overriddenBy: stored.overriddenBy,
      overrideReason: stored.overrideReason,
      overriddenAt: stored.overriddenAt,
    };
    if (!stored.noticeStartedAt || !stored.hostingRegion) await kvs.set(`decision:${issueKey}`, decision);
    return decision;
  }

  const { summary, description } = await fetchIssueText(issueKey);
  const vendors = await loadVendors();
  const result = await classifyTicket(summary, description, vendors);
  const decision: DecisionRecord = {
    issueKey,
    classification: result.classification,
    vendor: result.vendor,
    purpose: summary,
    hostingRegion: result.hostingRegion,
    aiReason: result.reasoning,
    noticeStartedAt: now.toISOString(),
  };
  await kvs.set(`decision:${issueKey}`, decision);
  return decision;
}

/**
 * The one place a ticket is assessed. The issue panel, the workflow validator,
 * the Rovo tools and the privacy request all call this, so they cannot disagree.
 */
export async function assessIssue(issueKey: string, now: Date = new Date()): Promise<IssueAssessment> {
  if (!issueKey) throw new Error('No issue key.');
  const decision = await loadOrCreateDecision(issueKey, now);
  const terms = await loadRegister();

  const hold = evaluateHold({
    classification: decision.classification,
    hostingRegion: decision.hostingRegion,
    terms,
    noticeStartedAt: new Date(decision.noticeStartedAt),
    now,
  });

  const binding = hold.bindingCustomer;
  const vendor = decision.vendor ?? 'the vendor';
  const wantsNotice = decision.classification === 'NEW_SUBPROCESSOR' || decision.classification === 'LOCATION_CHANGE';

  return {
    issueKey,
    classification: decision.classification,
    vendor: decision.vendor,
    purpose: decision.purpose,
    hostingRegion: decision.hostingRegion,
    aiReason: decision.aiReason,
    noticeStartedAt: decision.noticeStartedAt,
    holdApplies: hold.applies,
    holdActive: hold.active,
    failClosedReason: hold.failClosedReason,
    earliestGoLiveDate: hold.earliestGoLiveDate,
    earliestGoLiveISO: hold.earliestGoLiveISO,
    longestNoticeDays: hold.longestNoticeDays,
    affectedCustomers: hold.affectedCustomers,
    terminationRightsCount: hold.terminationRightsCount,
    terminationCustomers: hold.terminationCustomers,
    locationConflictsCount: hold.locationConflictsCount,
    conflictingCustomers: hold.conflictingCustomers,
    basis: hold.basis,
    sampleClauseCustomer: binding?.customerName,
    sampleClauseQuote: binding?.exactClause,
    legalRequestKey: decision.legalRequestKey,
    draftNotice: wantsNotice
      ? generateDraftCustomerNotice({
          vendor,
          purpose: decision.purpose || 'See the engineering ticket',
          region: decision.hostingRegion,
          earliestDate: hold.earliestGoLiveDate,
          issueKey,
          kind: decision.classification as 'NEW_SUBPROCESSOR' | 'LOCATION_CHANGE',
        })
      : null,
    overridden: decision.overridden,
    overriddenBy: decision.overriddenBy,
    overrideReason: decision.overrideReason,
  };
}
