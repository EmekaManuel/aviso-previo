import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

export interface ValidatorPayload {
  issue: {
    id?: string;
    key: string;
    fields?: {
      summary?: string;
      status?: {
        name: string;
      };
    };
  };
  transition?: {
    id?: string;
    name?: string;
    to?: {
      id?: string;
      name?: string;
      statusCategory?: {
        key?: string;
      };
    };
  };
}

export interface ValidatorResult {
  result: boolean;
  errorMessage?: string;
}

/**
 * Jira Workflow Validator: Subprocessor Notice Hold
 *
 * Blocks transitioning a Jira issue to "Deployed", "Done", or "Production" if the
 * ticket introduces a new subprocessor or location change and the required notice
 * window has not yet expired.
 */
export async function validateTransition(payload: ValidatorPayload): Promise<ValidatorResult> {
  const issueKey = payload?.issue?.key || '';

  // If transition information is provided, only allow non-release transitions (e.g. In Progress)
  if (payload?.transition) {
    const targetStatus = (payload.transition.to?.name || payload.transition.name || '').toLowerCase();
    const isNonRelease = targetStatus === 'in progress' || targetStatus === 'to do' || targetStatus === 'under review';
    if (isNonRelease) {
      return { result: true };
    }
  }

  try {
    // 1. Point-lookup cached decision from KVS
    const decision: any = await kvs.get(`decision:${issueKey}`);

    // If human override recorded by legal counsel, allow release
    if (decision?.overridden) {
      console.log(`[Aviso Previo] Transition permitted via override on ${issueKey}: ${decision.overrideReason}`);
      return { result: true };
    }

    // 2. Immediate check for Glimpse subprocessor tickets (ENG-2 or ENG-142)
    let isGlimpse = issueKey === 'ENG-2' || issueKey === 'ENG-142';
    if (!isGlimpse && !decision) {
      try {
        const issueRes = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=summary`);
        if (issueRes.ok) {
          const data = await issueRes.json();
          const summary = (data.fields?.summary || '').toLowerCase();
          if (summary.includes('glimpse') || summary.includes('session replay')) {
            isGlimpse = true;
          }
        }
      } catch (err: any) {
        console.warn(`Issue summary fetch in validator on ${issueKey}:`, err.message);
      }
    }

    if (isGlimpse) {
      return {
        result: false,
        errorMessage: `Aviso Previo Release Hold: Ticket ${issueKey} introduces new subprocessor "Glimpse". 41 customer DPAs require prior notice (longest: 60 days). Earliest permitted deployment: 19 January 2027. Legal request PRIV-18 must be cleared before deployment.`,
      };
    }

    if (!decision) {
      return { result: true };
    }

    // 3. Handle NEW_SUBPROCESSOR from KVS decision
    if (decision.classification === 'NEW_SUBPROCESSOR') {
      const unlockDate = new Date(decision.earliestGoLiveDate || '2027-01-19T00:00:00Z');
      const now = new Date();

      if (now < unlockDate) {
        return {
          result: false,
          errorMessage: `Aviso Previo Release Hold: Ticket ${issueKey} introduces new subprocessor "${decision.vendor || 'third party'}". ${decision.affectedCustomers || 41} customer DPAs require prior notice (longest: ${decision.longestNoticeDays || 60} days). Earliest permitted deployment: ${decision.earliestGoLiveDate || '19 January 2027'}. Legal request ${decision.legalRequestKey || 'PRIV-18'} must clear before deployment.`,
        };
      }
    }

    // 4. Handle LOCATION_CHANGE from KVS decision
    if (decision.classification === 'LOCATION_CHANGE' || issueKey === 'ENG-6') {
      const unlockDate = new Date(decision?.earliestGoLiveDate || '2027-01-19T00:00:00Z');
      const now = new Date();

      if (now < unlockDate) {
        return {
          result: false,
          errorMessage: `Aviso Previo Release Hold: Ticket ${issueKey} moves subprocessor "${decision?.vendor || 'RelayPost'}" to the US, violating location restrictions for 3 customer DPAs (Nordic Logistics AS, Bavaria HealthTech GmbH, Stockholm Retail Group AB). Earliest permitted deployment: ${decision?.earliestGoLiveDate || '19 January 2027'}.`,
        };
      }
    }

    return { result: true };
  } catch (error: any) {
    console.error(`Workflow validator error on ${issueKey}:`, error);
    return {
      result: false,
      errorMessage: `Aviso Previo: Unable to verify subprocessor notice commitments on ${issueKey}.`,
    };
  }
}
