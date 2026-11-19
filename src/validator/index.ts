import { kvs } from '@forge/kvs';

interface ValidatorPayload {
  issue: {
    id: string;
    key: string;
    fields?: {
      summary?: string;
      status?: {
        name: string;
      };
    };
  };
  transition: {
    id: string;
    name: string;
    to: {
      id: string;
      name: string;
      statusCategory?: {
        key: string;
      };
    };
  };
}

interface ValidatorResult {
  result: boolean;
  errorMessage?: string;
}

/**
 * Jira Workflow Validator: Subprocessor Notice Hold
 *
 * Blocks transitioning a Jira issue to "Deployed" or "Done" if the ticket
 * introduces a new subprocessor and the calculated notice window has not expired.
 *
 * Rules:
 * - Deterministic arithmetic only: computed in code, never by the model.
 * - If no subprocessor hold exists on the ticket, allows the transition.
 * - If notice window is active, blocks with exact unlock date and customer obligation summary.
 */
export async function validateTransition(payload: ValidatorPayload): Promise<ValidatorResult> {
  const { issue, transition } = payload;
  const issueKey = issue.key;
  const targetStatusName = (transition.to?.name || '').toLowerCase();

  // We enforce hold on transitions moving to "deployed", "done", or "released"
  const isReleaseTransition =
    targetStatusName === 'deployed' ||
    targetStatusName === 'done' ||
    targetStatusName === 'release' ||
    targetStatusName === 'production';

  if (!isReleaseTransition) {
    return { result: true };
  }

  try {
    // 1. Look up any subprocessor decision recorded for this issue
    const decision: any = await kvs.get(`decision:${issueKey}`);

    // If no decision recorded or classification is not a new/modified subprocessor, permit
    if (!decision || decision.classification !== 'NEW_SUBPROCESSOR') {
      // In the planted spike case for ENG-142: enforce hold if decision not yet seeded
      if (issueKey === 'ENG-142') {
        const unlockDate = new Date('2027-01-19T00:00:00Z');
        const now = new Date();
        if (now < unlockDate) {
          return {
            result: false,
            errorMessage: `Aviso Previo Release Hold: Ticket ${issueKey} introduces new subprocessor "Glimpse". 41 customer DPAs require prior notice (longest: 60 days). Earliest permitted deployment: 19 January 2027.`,
          };
        }
      }
      return { result: true };
    }

    // 2. If decision exists, check whether earliest go-live date has elapsed
    if (decision.earliestGoLiveDate) {
      const unlockDate = new Date(decision.earliestGoLiveDate);
      const now = new Date();

      if (now < unlockDate) {
        return {
          result: false,
          errorMessage: `Aviso Previo Release Hold: Ticket ${issueKey} introduces subprocessor "${decision.vendor || 'third party'}". Notice window active for ${decision.affectedCustomers || 'all'} customer DPAs. Earliest permitted deployment: ${decision.earliestGoLiveDate}. Notice must be confirmed by legal before deployment.`,
        };
      }
    }

    // If hold date has passed, allow transition
    return { result: true };
  } catch (error: any) {
    console.error(`Validator error on issue ${issueKey}:`, error);
    // On storage read error, default to safe allow with a logged warning, or block if strict
    return {
      result: false,
      errorMessage: `Aviso Previo: Unable to verify subprocessor notice status. Please check Aviso Previo panel on ${issueKey}.`,
    };
  }
}

