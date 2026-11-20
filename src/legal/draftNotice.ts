import type { HostingRegion } from '../types';

export const COMPANY = 'Ayo Payroll Ltd';
export const PRIVACY_EMAIL = 'privacy@ayopayroll.com';

export const regionLabel = (r: HostingRegion) =>
  r === 'EU_UK' ? 'EU/UK' : r === 'OUTSIDE_EU_UK' ? 'Outside the EU/UK (as described in the ticket)' : 'Not stated in the ticket';

/** Ready-to-send draft customer notice for privacy counsel to review. Pure. */
export function generateDraftCustomerNotice(opts: {
  vendor: string;
  purpose: string;
  region: HostingRegion;
  earliestDate: string;
  issueKey: string;
  kind: 'NEW_SUBPROCESSOR' | 'LOCATION_CHANGE';
}): { subject: string; body: string } {
  const { vendor, purpose, region, earliestDate, issueKey, kind } = opts;
  const subject =
    kind === 'NEW_SUBPROCESSOR'
      ? `[Prior notice] New subprocessor: ${vendor}`
      : `[Prior notice] Change of processing location: ${vendor}`;
  const intro =
    kind === 'NEW_SUBPROCESSOR'
      ? `${COMPANY} intends to authorize the following third-party subprocessor`
      : `${COMPANY} intends to change where the following subprocessor processes your data`;

  const body = `Dear Customer,

Pursuant to the subprocessor provisions of our Data Processing Agreement, this is prior written notice that ${intro}:

• Subprocessor: ${vendor}
• Purpose of processing: ${purpose}
• Processing location: ${regionLabel(region)}
• Earliest permitted deployment: ${earliestDate}
• Reference: ${issueKey}

Your objection window under the agreement is now open. For any data protection question or formal objection, please contact our Data Protection Officer at ${PRIVACY_EMAIL} before the deployment date above.

Sincerely,
Privacy & Data Governance Team
${COMPANY}`;

  return { subject, body };
}
