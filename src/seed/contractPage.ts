import type { DPATermSeed } from '../data/seedData';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The sample contract as a Confluence page. It contains the contract text only:
 * no summary of the terms, so reading it back is a real extraction task.
 * Some contracts keep the subprocessor wording under "International Data Transfers".
 */
export function buildContractHtml(dpa: DPATermSeed): string {
  const clause = `<p><em>&ldquo;${esc(dpa.exactClause)}&rdquo;</em></p>`;
  const subprocessors = dpa.isBuriedInDataTransfer
    ? `<p>Processor may engage subprocessors in accordance with this Agreement and applicable data protection law.</p>`
    : clause;
  const transfers = dpa.isBuriedInDataTransfer
    ? clause
    : `<p>Any transfer of Personal Data outside the country of the Controller shall be subject to appropriate safeguards required by applicable data protection law.</p>`;

  return `
<p><strong>Sample data · Fictional</strong></p>
<h2>Data Processing Agreement</h2>
<p>This Data Processing Agreement is entered into between Ayo Payroll Ltd (&ldquo;Processor&rdquo;) and ${esc(dpa.customerName)} (&ldquo;Controller&rdquo;), ${esc(dpa.country)}.</p>
<h3>Section 1: Definitions</h3>
<p>&ldquo;Personal Data&rdquo; means any information relating to an identified or identifiable natural person that Processor processes on behalf of Controller under the Services Agreement.</p>
<h3>Section 5: Security</h3>
<p>Processor shall implement appropriate technical and organisational measures to protect Personal Data against accidental or unlawful destruction, loss, alteration or unauthorised disclosure.</p>
<h3>Section 7: Engagement of Subprocessors</h3>
${subprocessors}
<h3>Section 8: Audit</h3>
<p>Processor shall make available to Controller the information reasonably necessary to demonstrate compliance with this Agreement.</p>
<h3>Section 9: International Data Transfers</h3>
${transfers}
<h3>Section 12: Term</h3>
<p>This Agreement remains in force for as long as Processor processes Personal Data on behalf of Controller.</p>
`;
}

export const contractTitle = (dpa: Pick<DPATermSeed, 'customerName' | 'id'>) =>
  `DPA — ${dpa.customerName} (${dpa.id}) [Sample data, fictional]`;

export const SUBPROCESSOR_PAGE_TITLE = 'Ayo Payroll — Published Subprocessor List (Sample data, fictional)';
