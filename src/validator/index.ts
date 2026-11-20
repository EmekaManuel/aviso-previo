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

export function isReleaseTransition(payload: ValidatorPayload): boolean {
  const t = payload.transition;
  if (!t) return true; // unknown: treat as a release, so we fail closed
  if (t.to?.statusCategory?.key === 'done') return true;
  return RELEASE_STATUS.test(`${t.to?.name ?? ''} ${t.name ?? ''}`);
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
  if (!isReleaseTransition(payload)) return { result: true };

  try {
    const a = await assessIssue(issueKey);
    if (a.overridden) {
      console.log(`[Aviso Previo] ${issueKey} released by counsel override: ${a.overrideReason}`);
      return { result: true };
    }
    if (a.holdApplies && a.holdActive) return { result: false, errorMessage: holdMessage(a) };
    return { result: true };
  } catch (error: any) {
    console.error(`Workflow validator error on ${issueKey}:`, error);
    return {
      result: false,
      errorMessage: `Aviso Previo: Unable to verify subprocessor notice commitments on ${issueKey}. ${error?.message ?? ''}`.trim(),
    };
  }
}
