import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { CUSTOMER_DPAS, PUBLISHED_VENDORS, SAMPLE_TICKETS } from '../data/seedData';
import { ensureSpace, upsertPage } from '../confluence/pages';
import { buildContractHtml, contractTitle, SUBPROCESSOR_PAGE_TITLE } from './contractPage';

export interface SeedProgressLog {
  stage: string;
  status: 'pending' | 'success' | 'skipped' | 'error';
  message: string;
}

/**
 * Seed KVS Storage
 * Directly loads all 41 customer DPAs, 9 approved vendors, and planted decisions into @forge/kvs.
 */
export async function seedStorage(onProgress?: (log: SeedProgressLog) => void): Promise<{
  dpaCount: number;
  vendorCount: number;
}> {
  // 1. Seed 9 Approved Vendors
  const vendorKeys: string[] = [];
  for (const v of PUBLISHED_VENDORS) {
    await kvs.set(`vendor:${v.key}`, v);
    vendorKeys.push(v.key);
  }
  await kvs.set('vendors:list', vendorKeys);
  onProgress?.({
    stage: 'Storage: Vendors',
    status: 'success',
    message: `Seeded ${vendorKeys.length} approved vendors in KVS.`,
  });

  // 2. Seed 41 Customer DPAs
  const dpaIds: string[] = [];
  for (const dpa of CUSTOMER_DPAS) {
    const { expectedStatus, isBuriedInDataTransfer, ...terms } = dpa;
    const previous = (await kvs.get(`dpa:${dpa.id}`)) as any;
    await kvs.set(`dpa:${dpa.id}`, {
      ...terms,
      confluencePageId: previous?.confluencePageId ?? null,
      status: expectedStatus,
      confirmedAt: expectedStatus === 'confirmed' ? '2026-11-01T10:00:00Z' : null,
      confirmedBy: expectedStatus === 'confirmed' ? 'Counsel (Ayo Payroll)' : null,
    });
    dpaIds.push(dpa.id);
  }
  await kvs.set('dpas:list', dpaIds);
  onProgress?.({
    stage: 'Storage: DPAs',
    status: 'success',
    message: `Loaded ${dpaIds.length} customer DPAs into the register (sample terms, labelled by hand).`,
  });

  // Ticket decisions are not seeded: each ticket is read and classified the first time it is assessed.
  return { dpaCount: dpaIds.length, vendorCount: vendorKeys.length };
}

/**
 * Confluence step. Writes the published subprocessor list and one page per customer DPA,
 * `size` contracts at a time so each call stays well inside Forge's time limit. Safe to repeat:
 * pages are found by title and updated, not duplicated. Each DPA record remembers its page id,
 * which is what the extractor later reads.
 */
export async function seedConfluenceBatch(
  offset: number,
  size: number,
  onProgress?: (log: SeedProgressLog) => void
): Promise<{ spaceKey: string; pagesWritten: number; nextOffset: number; done: boolean }> {
  const { id: spaceId, key: spaceKey } = await ensureSpace();
  let written = 0;

  if (offset === 0) {
    const rows = PUBLISHED_VENDORS.map(
      (v) => `<tr><td><strong>${v.name}</strong></td><td>${v.category}</td><td>${v.dataProcessed}</td><td>${v.hostingLocation}</td><td>${v.publishedDate}</td></tr>`
    ).join('');
    await upsertPage(
      spaceId,
      SUBPROCESSOR_PAGE_TITLE,
      `<p><strong>Sample data · Fictional</strong></p><p>The official list of approved third-party subprocessors engaged by Ayo Payroll.</p><table><thead><tr><th>Vendor</th><th>Purpose</th><th>Data processed</th><th>Location</th><th>Approved</th></tr></thead><tbody>${rows}</tbody></table>`
    );
    written++;
  }

  const batch = CUSTOMER_DPAS.slice(offset, offset + size);
  const ids = await Promise.all(batch.map((dpa) => upsertPage(spaceId, contractTitle(dpa), buildContractHtml(dpa))));
  await Promise.all(
    batch.map(async (dpa, i) => {
      const record = (await kvs.get(`dpa:${dpa.id}`)) as any;
      if (record) await kvs.set(`dpa:${dpa.id}`, { ...record, confluencePageId: ids[i] });
    })
  );
  written += batch.length;

  const nextOffset = offset + batch.length;
  const done = nextOffset >= CUSTOMER_DPAS.length;
  onProgress?.({
    stage: 'Confluence: DPA pages',
    status: 'success',
    message: done ? `All ${CUSTOMER_DPAS.length} contract pages are in space "${spaceKey}".` : `Wrote ${nextOffset} of ${CUSTOMER_DPAS.length} contract pages.`,
  });
  return { spaceKey, pagesWritten: written, nextOffset, done };
}

/**
 * Seed Jira Company-Managed Projects and Issues
 * Creates or verifies company-managed project "ENG" and creates planted tickets.
 */
export async function seedJira(onProgress?: (log: SeedProgressLog) => void): Promise<{
  projectKey: string;
  issuesCreated: number;
  createdTicketKeys: string[];
}> {
  let projectKey = 'ENG';
  let issuesCreated = 0;
  const createdTicketKeys: string[] = [];

  // 1. Fetch current lead user account ID
  let leadAccountId = '712020:45bfc29d-0d71-4945-84ca-66c80a3d9c5b';
  try {
    const userSearchRes = await api.asApp().requestJira(route`/rest/api/3/users/search?maxResults=1`);
    if (userSearchRes.ok) {
      const userData = await userSearchRes.json();
      if (userData[0]?.accountId) {
        leadAccountId = userData[0].accountId;
      }
    }
  } catch (e: any) {
    console.warn('User search API fetch:', e.message);
  }

  // 2. Check if ENG project exists
  try {
    const projRes = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`);
    if (projRes.ok) {
      onProgress?.({
        stage: 'Jira: Project ENG',
        status: 'success',
        message: `Project ${projectKey} exists.`,
      });
    } else {
      // Try creating ENG project
      const createProjRes = await api.asApp().requestJira(route`/rest/api/3/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          key: projectKey,
          name: 'Engineering',
          projectTypeKey: 'software',
          projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-scrum-classic',
          description: 'Ayo Payroll Engineering (Company-Managed Project · Sample data, fictional)',
          leadAccountId,
          assigneeType: 'PROJECT_LEAD',
        }),
      });

      if (createProjRes.ok) {
        onProgress?.({
          stage: 'Jira: Project ENG',
          status: 'success',
          message: `Created company-managed project "${projectKey}".`,
        });
      } else {
        // Fall back to first available project
        const listProjRes = await api.asApp().requestJira(route`/rest/api/3/project`);
        if (listProjRes.ok) {
          const projs = await listProjRes.json();
          if (projs.length > 0) {
            projectKey = projs[0].key;
            onProgress?.({
              stage: 'Jira: Project Fallback',
              status: 'success',
              message: `Using active project "${projectKey}" (${projs[0].name}) for test tickets.`,
            });
          }
        }
      }
    }
  } catch (e: any) {
    console.warn('Jira project setup:', e.message);
  }

  // 3. Create the 4 Planted Tickets in Project
  for (const ticket of SAMPLE_TICKETS.slice(0, 4)) {
    try {
      const issueRes = await api.asApp().requestJira(route`/rest/api/3/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary: ticket.summary,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: ticket.description,
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
        const issueData = await issueRes.json();
        createdTicketKeys.push(issueData.key);
        issuesCreated++;
      }
    } catch (e: any) {
      console.warn(`Error creating issue "${ticket.summary}":`, e.message);
    }
  }

  onProgress?.({
    stage: 'Jira: Planted Issues',
    status: 'success',
    message: `Created tickets in project "${projectKey}": ${createdTicketKeys.join(', ')}.`,
  });

  return { projectKey, issuesCreated, createdTicketKeys };
}

/** One step of the sample-data load. The admin page calls these in turn and shows progress. */
export type SeedStep = 'storage' | 'jira' | 'confluence';

export async function runSeedStep(
  step: SeedStep,
  offset = 0,
  size = 6
): Promise<{ logs: SeedProgressLog[]; done: boolean; nextOffset?: number }> {
  const logs: SeedProgressLog[] = [];
  const track = (l: SeedProgressLog) => logs.push(l);

  if (step === 'storage') {
    await seedStorage(track);
    return { logs, done: true };
  }
  if (step === 'jira') {
    const jira = await seedJira(track);
    // A reload starts the planted tickets afresh: drop any earlier assessment or override for them.
    for (const key of jira.createdTicketKeys) await kvs.delete(`decision:${key}`);
    return { logs, done: true };
  }
  const result = await seedConfluenceBatch(offset, size, track);
  return { logs, done: result.done, nextOffset: result.nextOffset };
}
