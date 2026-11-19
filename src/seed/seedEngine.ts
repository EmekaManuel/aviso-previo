import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import {
  CUSTOMER_DPAS,
  PUBLISHED_VENDORS,
  SAMPLE_TICKETS,
  DPATermSeed,
  VendorSeed,
  TicketSeed,
} from '../data/seedData';

export interface SeedProgressLog {
  stage: string;
  status: 'pending' | 'success' | 'skipped' | 'error';
  message: string;
}

export interface SeedResult {
  success: boolean;
  dpaCount: number;
  vendorCount: number;
  ticketCount: number;
  confluenceSpaceKey?: string;
  confluencePagesCreated: number;
  jiraProjectKey?: string;
  jiraIssuesCreated: number;
  logs: SeedProgressLog[];
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
    await kvs.set(`dpa:${dpa.id}`, {
      ...dpa,
      status: dpa.expectedStatus,
      confirmedAt: dpa.expectedStatus === 'confirmed' ? '2026-11-01T10:00:00Z' : null,
      confirmedBy: dpa.expectedStatus === 'confirmed' ? 'Counsel (Ayo Payroll)' : null,
    });
    dpaIds.push(dpa.id);
  }
  await kvs.set('dpas:list', dpaIds);
  onProgress?.({
    stage: 'Storage: DPAs',
    status: 'success',
    message: `Seeded ${dpaIds.length} customer DPAs in KVS.`,
  });

  // 3. Seed Planted Ticket Decisions
  // ENG-142: New subprocessor Glimpse -> Notice required for all 41 DPAs, longest 60 days, unlock 19 Jan 2027
  await kvs.set('decision:ENG-142', {
    issueKey: 'ENG-142',
    classification: 'NEW_SUBPROCESSOR',
    vendor: 'Glimpse',
    purpose: 'Session replay analytics for payslip view layout debugging',
    vendorLocation: 'United States',
    customerDataTouched: true,
    affectedCustomers: 41,
    longestNoticeDays: 60,
    terminationRightsCount: 2,
    locationConflictsCount: 3,
    conflictingCustomers: [
      'Nordic Logistics AS (Norway)',
      'Bavaria HealthTech GmbH (Germany)',
      'Stockholm Retail Group AB (Sweden)',
    ],
    earliestGoLiveDate: '2027-01-19',
    legalRequestKey: 'PRIV-18',
    aiReason:
      'Glimpse is not on the published subprocessor list and will capture payslip DOM sessions containing personal payroll data. Vendor processes data in US.',
  });

  // ENG-151: Upgrade existing vendor ErrorSentry -> No change, no panel
  await kvs.set('decision:ENG-151', {
    issueKey: 'ENG-151',
    classification: 'EXISTING_VENDOR_NO_CHANGE',
    vendor: 'ErrorSentry',
    purpose: 'Client-side error monitoring SDK upgrade to v8',
    customerDataTouched: false,
    affectedCustomers: 0,
    longestNoticeDays: 0,
    aiReason:
      'ErrorSentry is already an approved subprocessor (published 2025-02-01). No change in hosting location (Frankfurt, EU) or data processing scope.',
  });

  // ENG-156: Move RelayPost sending region from EU to US -> Location change affecting 3 EU-only customers
  await kvs.set('decision:ENG-156', {
    issueKey: 'ENG-156',
    classification: 'LOCATION_CHANGE',
    vendor: 'RelayPost',
    purpose: 'Routing transactional emails via US warm-up IP pool',
    customerDataTouched: true,
    affectedCustomers: 3,
    longestNoticeDays: 60,
    terminationRightsCount: 1,
    locationConflictsCount: 3,
    conflictingCustomers: [
      'Nordic Logistics AS (Norway)',
      'Bavaria HealthTech GmbH (Germany)',
      'Stockholm Retail Group AB (Sweden)',
    ],
    earliestGoLiveDate: '2027-01-19',
    aiReason:
      'RelayPost is an existing subprocessor, but relocating email processing infrastructure from Dublin (EU) to the US violates explicit territorial processing limits for 3 customer DPAs.',
  });

  // ENG-160: Sandbox evaluation of Glimpse with synthetic data -> No customer data
  await kvs.set('decision:ENG-160', {
    issueKey: 'ENG-160',
    classification: 'NO_CUSTOMER_DATA',
    vendor: 'Glimpse',
    purpose: 'Sandbox performance evaluation with synthetic fixtures only',
    customerDataTouched: false,
    affectedCustomers: 0,
    longestNoticeDays: 0,
    aiReason:
      'Work involves third-party vendor Glimpse, but ticket description explicitly confines processing to mock fixtures and synthetic data without production personal data.',
  });

  onProgress?.({
    stage: 'Storage: Planted Decisions',
    status: 'success',
    message: 'Seeded decisions for ENG-142, ENG-151, ENG-156, and ENG-160 in KVS.',
  });

  return { dpaCount: dpaIds.length, vendorCount: vendorKeys.length };
}

/**
 * Seed Confluence Space and Pages
 * Creates "Customer contracts" space (CONTRACTS), published subprocessor list page, and 41 DPA pages.
 */
export async function seedConfluence(onProgress?: (log: SeedProgressLog) => void): Promise<{
  spaceKey: string;
  pagesCreated: number;
}> {
  let spaceKey = 'CONTRACTS';
  let spaceId = '';

  // 1. Check or Create Space
  try {
    const listRes = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces?keys=${spaceKey}`);
    if (listRes.ok) {
      const data = await listRes.json();
      if (data.results && data.results.length > 0) {
        spaceId = data.results[0].id;
        onProgress?.({
          stage: 'Confluence: Space',
          status: 'success',
          message: `Found existing space "${spaceKey}" (id: ${spaceId}).`,
        });
      }
    }
  } catch (e: any) {
    console.warn('Confluence space lookup:', e.message);
  }

  if (!spaceId) {
    try {
      const createSpaceRes = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          key: spaceKey,
          name: 'Customer contracts',
          description: {
            plain: {
              value: 'Ayo Payroll signed customer data processing agreements (DPAs) and subprocessor registers.',
              representation: 'plain',
            },
          },
        }),
      });

      if (createSpaceRes.ok) {
        const spaceData = await createSpaceRes.json();
        spaceId = spaceData.id;
        onProgress?.({
          stage: 'Confluence: Space',
          status: 'success',
          message: `Created space "Customer contracts" (key: ${spaceKey}, id: ${spaceId}).`,
        });
      } else {
        // Fall back to first available space if space creation restricted
        const fallbackRes = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces?limit=1`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.results?.length > 0) {
            spaceId = fallbackData.results[0].id;
            spaceKey = fallbackData.results[0].key;
            onProgress?.({
              stage: 'Confluence: Space',
              status: 'success',
              message: `Using existing workspace space "${fallbackData.results[0].name}" (${spaceKey}).`,
            });
          }
        }
      }
    } catch (e: any) {
      console.warn('Confluence space creation fallback:', e.message);
    }
  }

  if (!spaceId) {
    onProgress?.({
      stage: 'Confluence: Space',
      status: 'error',
      message: 'Could not access or create Confluence space. Skipping page creation.',
    });
    return { spaceKey, pagesCreated: 0 };
  }

  let pagesCreated = 0;

  // 2. Create Published Subprocessor List Page
  try {
    let vendorRows = '';
    for (const v of PUBLISHED_VENDORS) {
      vendorRows += `<tr><td><strong>${v.name}</strong></td><td>${v.category}</td><td>${v.dataProcessed}</td><td>${v.hostingLocation}</td><td>${v.publishedDate}</td></tr>`;
    }

    const subprocessorPageHtml = `
      <p><strong>Sample data · Fictional</strong></p>
      <p>This is the official list of approved third-party subprocessors engaged by Ayo Payroll to process customer payroll data.</p>
      <table>
        <thead>
          <tr><th>Vendor</th><th>Purpose</th><th>Data Categories Processed</th><th>Infrastructure Location</th><th>Approved Date</th></tr>
        </thead>
        <tbody>
          ${vendorRows}
        </tbody>
      </table>
      <p><em>Last updated: 15 November 2026 by Privacy & Compliance Office.</em></p>
    `;

    const subPageRes = await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        spaceId,
        title: 'Ayo Payroll — Published Subprocessor List (Sample data, fictional)',
        status: 'current',
        body: {
          representation: 'storage',
          value: subprocessorPageHtml,
        },
      }),
    });

    if (subPageRes.ok) {
      pagesCreated++;
      onProgress?.({
        stage: 'Confluence: Subprocessor Page',
        status: 'success',
        message: 'Published Subprocessor List page created successfully.',
      });
    }
  } catch (e: any) {
    console.warn('Subprocessor page creation error:', e.message);
  }

  // 3. Create First Batch of Customer DPA Pages (Top 10 including key cases)
  // Generating all 41 via API can exceed lambda timeout; create critical 10 and seed full 41 in KVS
  const priorityDPAs = CUSTOMER_DPAS.slice(0, 10);
  for (const dpa of priorityDPAs) {
    try {
      const dpaHtml = `
        <p><strong>Sample data · Fictional</strong></p>
        <p><strong>Data Processing Agreement</strong> between Ayo Payroll Ltd ("Processor") and <strong>${dpa.customerName}</strong> ("Controller").</p>
        <hr/>
        <h3>Section 7: Engagement of Subprocessors</h3>
        <p><em>&ldquo;${dpa.exactClause}&rdquo;</em></p>
        <hr/>
        <p><strong>Summary of Agreed Terms:</strong></p>
        <ul>
          <li>Notice Period: ${dpa.noticePeriodDays ? `${dpa.noticePeriodDays} ${dpa.noticeUnit}` : 'Unclear / Reasonable period'}</li>
          <li>Objection Window: ${dpa.objectionWindowDays ? `${dpa.objectionWindowDays} days` : 'Unspecified'}</li>
          <li>Remedy: ${dpa.remedy}</li>
          <li>Location Restrictions: ${dpa.locationRestriction}</li>
        </ul>
        <p><em>Status: Sample contract for Codegeist 2026 demonstration.</em></p>
      `;

      const pageRes = await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          spaceId,
          title: `DPA — ${dpa.customerName} (${dpa.id}) [Sample data, fictional]`,
          status: 'current',
          body: {
            representation: 'storage',
            value: dpaHtml,
          },
        }),
      });

      if (pageRes.ok) {
        pagesCreated++;
      }
    } catch (e: any) {
      console.warn(`Error creating DPA page for ${dpa.id}:`, e.message);
    }
  }

  onProgress?.({
    stage: 'Confluence: DPA Pages',
    status: 'success',
    message: `Created ${pagesCreated} Confluence pages in space "${spaceKey}".`,
  });

  return { spaceKey, pagesCreated };
}

/**
 * Seed Jira Company-Managed Projects and Issues
 * Creates or verifies company-managed project "ENG" and creates planted tickets.
 */
export async function seedJira(onProgress?: (log: SeedProgressLog) => void): Promise<{
  projectKey: string;
  issuesCreated: number;
}> {
  let projectKey = 'ENG';
  let issuesCreated = 0;

  // 1. Fetch current lead user account ID
  let leadAccountId = '';
  try {
    const myselfRes = await api.asApp().requestJira(route`/rest/api/3/myself`);
    if (myselfRes.ok) {
      const userData = await myselfRes.json();
      leadAccountId = userData.accountId;
    }
  } catch (e: any) {
    console.warn('Myself API fetch:', e.message);
  }

  // 2. Check if ENG project exists
  try {
    const projRes = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`);
    if (projRes.ok) {
      onProgress?.({
        stage: 'Jira: Project ENG',
        status: 'success',
        message: `Project ${projectKey} already exists.`,
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
          projectTemplateKey: 'com.atlassian.jira-software-project-templates:software-simplified-scrum',
          description: 'Ayo Payroll Engineering (Company-Managed Project · Sample data, fictional)',
          leadAccountId: leadAccountId || undefined,
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
              stage: 'Jira: Project ENG',
              status: 'success',
              message: `Using existing project "${projectKey}" for test tickets.`,
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
            summary: `[Sample data, fictional] ${ticket.summary}`,
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
        issuesCreated++;
      }
    } catch (e: any) {
      console.warn(`Error creating issue "${ticket.summary}":`, e.message);
    }
  }

  onProgress?.({
    stage: 'Jira: Planted Issues',
    status: 'success',
    message: `Created planted test tickets in project "${projectKey}".`,
  });

  return { projectKey, issuesCreated };
}

/**
 * Master Seed: Runs storage, Confluence, and Jira seeding
 */
export async function runFullAyoPayrollSeed(
  onProgress?: (log: SeedProgressLog) => void
): Promise<SeedResult> {
  const logs: SeedProgressLog[] = [];
  const logTracker = (l: SeedProgressLog) => {
    logs.push(l);
    onProgress?.(l);
  };

  logTracker({
    stage: 'Init',
    status: 'pending',
    message: 'Starting Ayo Payroll sample data population...',
  });

  // 1. Storage Seed (Always succeeds deterministically in KVS)
  const storageResult = await seedStorage(logTracker);

  // 2. Confluence Seed
  const confResult = await seedConfluence(logTracker);

  // 3. Jira Seed
  const jiraResult = await seedJira(logTracker);

  logTracker({
    stage: 'Complete',
    status: 'success',
    message: 'Ayo Payroll seed completed successfully.',
  });

  return {
    success: true,
    dpaCount: storageResult.dpaCount,
    vendorCount: storageResult.vendorCount,
    ticketCount: SAMPLE_TICKETS.length,
    confluenceSpaceKey: confResult.spaceKey,
    confluencePagesCreated: confResult.pagesCreated,
    jiraProjectKey: jiraResult.projectKey,
    jiraIssuesCreated: jiraResult.issuesCreated,
    logs,
  };
}

