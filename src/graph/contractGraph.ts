import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { graph, types } from '@forge/teamwork-graph';
import { evaluateHold } from '../engine/holdPolicy';
import { loadRegister } from '../storage/register';
import type { DpaRecord } from '../types';
import type { DecisionRecord } from '../assessment/assessIssue';

/**
 * Teamwork Graph connector.
 *
 * Each customer DPA is ingested as an `atlassian:document`, and associated with the Jira
 * issues whose release hold it binds. That links contracts to work in the graph, so Rovo
 * search and agents can answer "which contracts does ENG-2 touch?" and "which tickets
 * does this DPA constrain?". The data lives on the same site; an admin connects the
 * connector once under Apps > Connected apps.
 */

export const CONNECTION_KEY = 'graph:connection';
export const LAST_SYNC_KEY = 'graph:lastSync';

export interface GraphSyncStatus {
  at: string;
  ok: boolean;
  synced: number;
  rejected: number;
  linkedTickets: number;
  message?: string;
}

/** Called by Atlassian when an admin connects, updates or removes the connector. */
export async function onConnectionChange(req: {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  name: string;
  connectionId: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    if (req.action === 'DELETED') {
      await kvs.delete(CONNECTION_KEY);
      await kvs.delete(LAST_SYNC_KEY);
      return { success: true, message: 'Disconnected. Atlassian removes the ingested data.' };
    }
    await kvs.set(CONNECTION_KEY, { connectionId: req.connectionId, name: req.name });
    await syncContractsToGraph().catch((e) => console.warn('Teamwork Graph first sync:', e?.message));
    return { success: true, message: 'Connected. Contracts are being added to the Teamwork Graph.' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Connection change failed.' };
  }
}

const everyoneInWorkspace = { accessControls: [{ principals: [{ type: 'ATLASSIAN_WORKSPACE' as const }] }] };

export function buildContractObject(
  dpa: DpaRecord,
  issueKeys: string[],
  baseUrl: string,
  sequence: number,
  nowISO: string
): types.DocumentObject {
  const notice =
    dpa.noticePeriodDays && dpa.noticeUnit !== 'unclear'
      ? `${dpa.noticePeriodDays} ${dpa.noticeUnit.replace('_', ' ')}`
      : 'not stated (counsel to decide)';
  const labels = ['dpa', 'subprocessor-notice', dpa.status];
  if (dpa.remedy === 'terminate') labels.push('termination-right');
  if (dpa.locationRestriction === 'EU_UK_ONLY') labels.push('eu-uk-only');

  const object: types.DocumentObject = {
    schemaVersion: '1.0',
    id: `dpa-${dpa.id}`,
    updateSequenceNumber: sequence,
    displayName: `DPA: ${dpa.customerName}`,
    description: `${dpa.country}. Subprocessor notice: ${notice}. Status: ${dpa.status}.`,
    url: dpa.confluencePageId ? `${baseUrl}/wiki/pages/viewpage.action?pageId=${dpa.confluencePageId}` : baseUrl,
    createdAt: dpa.confirmedAt ?? nowISO,
    lastUpdatedAt: nowISO,
    permissions: [everyoneInWorkspace],
    'atlassian:document': {
      type: { category: 'DOCUMENT' },
      content: { mimeType: 'text/plain', text: `Subprocessor clause: ${dpa.exactClause}` },
      labels,
    },
  };
  if (issueKeys.length > 0) {
    object.associations = { lastUpdatedAt: nowISO, set: [{ associationType: 'issueIdOrKeys', values: issueKeys }] };
  }
  return object;
}

/** Which tickets' holds bind which contracts, from the stored decisions and the current register. */
export async function contractTicketLinks(terms: DpaRecord[], now: Date): Promise<Map<string, string[]>> {
  const index = ((await kvs.get('decisions:index')) as string[] | undefined) ?? [];
  const links = new Map<string, string[]>();
  for (const key of index) {
    const d = (await kvs.get(`decision:${key}`)) as DecisionRecord | undefined;
    if (!d || (d.classification !== 'NEW_SUBPROCESSOR' && d.classification !== 'LOCATION_CHANGE')) continue;
    const hold = evaluateHold({
      classification: d.classification,
      hostingRegion: d.hostingRegion,
      terms,
      noticeStartedAt: new Date(d.noticeStartedAt),
      now,
    });
    for (const id of hold.affectedIds) links.set(id, [...(links.get(id) ?? []), key]);
  }
  return links;
}

async function siteBaseUrl(): Promise<string> {
  const res = await api.asApp().requestJira(route`/rest/api/3/serverInfo`);
  if (!res.ok) throw new Error(`Could not read the site address (HTTP ${res.status}).`);
  return ((await res.json()).baseUrl as string).replace(/\/$/, '');
}

/**
 * Pushes the register to the Teamwork Graph. Does nothing until an admin has connected
 * the connector. Always records the outcome so the admin page can show it.
 */
export async function syncContractsToGraph(): Promise<GraphSyncStatus | null> {
  const connection = (await kvs.get(CONNECTION_KEY)) as { connectionId: string } | undefined;
  if (!connection) return null;

  const record = async (s: Omit<GraphSyncStatus, 'at'>) => {
    const status: GraphSyncStatus = { at: new Date().toISOString(), ...s };
    await kvs.set(LAST_SYNC_KEY, status);
    return status;
  };

  try {
    const now = new Date();
    const terms = await loadRegister();
    if (terms.length === 0) return record({ ok: true, synced: 0, rejected: 0, linkedTickets: 0, message: 'The register is empty.' });

    const [baseUrl, links] = await Promise.all([siteBaseUrl(), contractTicketLinks(terms, now)]);
    const objects = terms.map((t) => buildContractObject(t, links.get(t.id) ?? [], baseUrl, now.getTime(), now.toISOString()));

    let accepted = 0;
    let rejected = 0;
    let firstError = '';
    for (let i = 0; i < objects.length; i += 100) {
      const res = await graph.setObjects({ objects: objects.slice(i, i + 100), connectionId: connection.connectionId });
      if (!res.success) throw new Error(res.error || 'The Teamwork Graph refused the request.');
      accepted += res.results?.accepted?.length ?? 0;
      const bad = res.results?.rejected ?? [];
      rejected += bad.length;
      if (bad.length && !firstError) firstError = `${bad[0].key?.entityId}: ${bad[0].errors?.[0]?.message ?? 'rejected'}`;
    }

    return record({
      ok: rejected === 0,
      synced: accepted,
      rejected,
      linkedTickets: new Set([...links.values()].flat()).size,
      message: rejected ? `Some contracts were rejected. First: ${firstError}` : undefined,
    });
  } catch (e: any) {
    return record({ ok: false, synced: 0, rejected: 0, linkedTickets: 0, message: e?.message || 'Sync failed.' });
  }
}

export async function getGraphStatus(): Promise<{ connected: boolean; lastSync: GraphSyncStatus | null }> {
  const connection = await kvs.get(CONNECTION_KEY);
  const lastSync = ((await kvs.get(LAST_SYNC_KEY)) as GraphSyncStatus | undefined) ?? null;
  return { connected: Boolean(connection), lastSync };
}
