import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { assessIssue } from '../assessment/assessIssue';

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

const doc = (lines: string[]) => ({
  type: 'doc',
  version: 1,
  content: lines.map((text) => ({ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] })),
});

async function projectExists(key: string): Promise<boolean> {
  const res = await api.asApp().requestJira(route`/rest/api/3/project/${key}`);
  return res.ok;
}

/**
 * Opens a privacy request in Jira for counsel, or returns the one already linked
 * to the ticket. It is created in project `PRIV` when that exists, otherwise in
 * the ticket's own project. If Jira refuses, this throws: it never invents a key.
 */
export async function createOrFetchLegalRequest(issueKey: string): Promise<LegalNoticeDraft> {
  const a = await assessIssue(issueKey);
  if (!a.draftNotice) {
    throw new Error(`${issueKey} does not introduce a subprocessor or a location change, so no notice is needed.`);
  }

  let requestKey = a.legalRequestKey;
  if (!requestKey) {
    const ticketProject = issueKey.split('-')[0];
    const projectKey = (await projectExists('PRIV')) ? 'PRIV' : ticketProject;
    const res = await api.asApp().requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        fields: {
          project: { key: projectKey },
          summary: `[Subprocessor notice] ${a.vendor ?? 'Vendor'} (${issueKey})`,
          labels: ['privacy-notice'],
          description: doc([
            `Aviso Previo opened this request for ${issueKey}.`,
            `Subprocessor: ${a.vendor ?? 'not named'}`,
            `Earliest permitted go-live: ${a.earliestGoLiveDate}`,
            `Customer DPAs affected: ${a.affectedCustomers}; longest notice: ${a.longestNoticeDays} days`,
            '',
            `Draft notice subject: ${a.draftNotice.subject}`,
            '',
            a.draftNotice.body,
          ]),
          issuetype: { name: 'Task' },
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`Jira refused to create the privacy request in ${projectKey} (HTTP ${res.status}).`);
    }
    requestKey = (await res.json()).key as string;

    const decision = ((await kvs.get(`decision:${issueKey}`)) as any) ?? {};
    await kvs.set(`decision:${issueKey}`, { ...decision, legalRequestKey: requestKey });
  }

  return {
    requestKey,
    vendor: a.vendor ?? '',
    earliestGoLiveDate: a.earliestGoLiveDate,
    affectedCustomerCount: a.affectedCustomers,
    longestNoticeDays: a.longestNoticeDays,
    terminationCustomers: a.terminationCustomers,
    locationConflictCustomers: a.conflictingCustomers,
    draftEmailSubject: a.draftNotice.subject,
    draftEmailBody: a.draftNotice.body,
  };
}
