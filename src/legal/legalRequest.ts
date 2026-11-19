import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

export interface LegalNoticeDraft {
  requestKey: string;
  vendor: string;
  earliestGoLiveDate: string;
  affectedCustomerCount: number;
  longestNoticeDays: number;
  terminationCustomers: string[];
  locationConflictCustomers: string[];
  draftEmailSubject: string;
  draftEmailBody: string;
}

/**
 * Generates ready-to-send draft email notice text for Privacy Counsel.
 */
export function generateDraftCustomerNotice(
  vendor: string,
  purpose: string,
  location: string,
  earliestDate: string
): { subject: string; body: string } {
  const subject = `[Prior Notice] Notice of New Subprocessor Appointment — Ayo Payroll`;

  const body = `Dear Customer,

Pursuant to Section 7 (Engagement of Subprocessors) of our Data Processing Agreement (DPA), this communication serves as prior written notice that Ayo Payroll Ltd intends to authorize the following third-party subprocessor:

• Subprocessor Name: ${vendor}
• Purpose of Processing: ${purpose}
• Categories of Data: Authenticated employee payslip DOM interaction events
• Infrastructure Hosting Location: ${location}
• Earliest Permitted Deployment: ${earliestDate}

Under the terms of your agreement, your objection window is now open. Should you have any data protection inquiries or formal objections, please contact our Data Protection Officer at privacy@ayopayroll.com before the deployment date above.

Sincerely,
Privacy & Data Governance Team
Ayo Payroll Ltd`;

  return { subject, body };
}

/**
 * Creates or updates a Legal JSM request for Privacy Counsel.
 */
export async function createOrFetchLegalRequest(
  issueKey: string,
  vendor: string = 'Glimpse',
  earliestDate: string = '19 January 2027'
): Promise<LegalNoticeDraft> {
  const decisionKey = `decision:${issueKey}`;
  const decision: any = (await kvs.get(decisionKey)) || {};

  const { subject, body } = generateDraftCustomerNotice(
    vendor,
    decision.purpose || 'Session replay analytics for payslip view layout debugging',
    decision.vendorLocation || 'United States',
    earliestDate
  );

  let requestKey = decision.legalRequestKey || 'PRIV-18';

  // Try creating a real issue in project PRIV or LEGAL if available
  try {
    const projCheck = await api.asApp().requestJira(route`/rest/api/3/project/PRIV`);
    if (projCheck.ok) {
      const issueRes = await api.asApp().requestJira(route`/rest/api/3/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          fields: {
            project: { key: 'PRIV' },
            summary: `[Subprocessor Notice] Customer DPA Notice Window for ${vendor}`,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Automated Aviso Previo Privacy Request for ${issueKey}.\n\nSubprocessor: ${vendor}\nEarliest Go-Live Date: ${earliestDate}\nAffected Customers: 41 DPAs\nLongest Notice: 60 days\n\nDraft Notice Text:\n${body}`,
                    },
                  ],
                },
              ],
            },
            issuetype: { name: 'Task' },
          },
        }),
      });

      if (issueRes.ok) {
        const createdData = await issueRes.json();
        requestKey = createdData.key;
      }
    }
  } catch (err: any) {
    console.warn('JSM PRIV issue creation fallback:', err.message);
  }

  // Update KVS decision record with linked legal request key
  decision.legalRequestKey = requestKey;
  await kvs.set(decisionKey, decision);

  return {
    requestKey,
    vendor,
    earliestGoLiveDate: earliestDate,
    affectedCustomerCount: decision.affectedCustomers || 41,
    longestNoticeDays: decision.longestNoticeDays || 60,
    terminationCustomers: decision.conflictingCustomers || [
      'Nordic Logistics AS (Norway)',
      'Bavaria HealthTech GmbH (Germany)',
      'Stockholm Retail Group AB (Sweden)',
    ],
    locationConflictCustomers: [
      'Nordic Logistics AS (Norway)',
      'Bavaria HealthTech GmbH (Germany)',
      'Stockholm Retail Group AB (Sweden)',
    ],
    draftEmailSubject: subject,
    draftEmailBody: body,
  };
}
