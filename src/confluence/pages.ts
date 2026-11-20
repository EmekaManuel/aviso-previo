import api, { route } from '@forge/api';
import { htmlToText } from '../extraction/text';

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

export const SPACE_KEY = 'CONTRACTS';

/** Finds the contracts space, or creates it. Falls back to any space the app can see. */
export async function ensureSpace(): Promise<{ id: string; key: string }> {
  const found = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces?keys=${SPACE_KEY}`);
  if (found.ok) {
    const data = await found.json();
    if (data.results?.length) return { id: data.results[0].id, key: SPACE_KEY };
  }
  const created = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      key: SPACE_KEY,
      name: 'Customer contracts',
      description: { plain: { value: 'Ayo Payroll signed customer data processing agreements (sample data, fictional).', representation: 'plain' } },
    }),
  });
  if (created.ok) {
    const data = await created.json();
    return { id: data.id, key: SPACE_KEY };
  }
  const any = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces?limit=1`);
  if (any.ok) {
    const data = await any.json();
    if (data.results?.length) return { id: data.results[0].id, key: data.results[0].key };
  }
  throw new Error('Could not find or create a Confluence space for the contracts.');
}

/** Creates the page, or replaces the body of the page with the same title. Returns its id. */
export async function upsertPage(spaceId: string, title: string, html: string): Promise<string> {
  const existing = await api.asApp().requestConfluence(
    route`/wiki/api/v2/pages?space-id=${spaceId}&title=${title}&limit=1`
  );
  if (existing.ok) {
    const data = await existing.json();
    const hit = data.results?.[0];
    if (hit) {
      const current = await api.asApp().requestConfluence(route`/wiki/api/v2/pages/${hit.id}`);
      const version = current.ok ? ((await current.json()).version?.number ?? 1) : 1;
      const update = await api.asApp().requestConfluence(route`/wiki/api/v2/pages/${hit.id}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify({ id: hit.id, status: 'current', title, body: { representation: 'storage', value: html }, version: { number: version + 1 } }),
      });
      if (!update.ok) throw new Error(`Confluence refused to update "${title}" (HTTP ${update.status}).`);
      return hit.id;
    }
  }
  const res = await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ spaceId, title, status: 'current', body: { representation: 'storage', value: html } }),
  });
  if (!res.ok) throw new Error(`Confluence refused to create "${title}" (HTTP ${res.status}).`);
  return (await res.json()).id;
}

/** The text of a Confluence page. */
export async function getPageText(pageId: string): Promise<string> {
  const res = await api.asApp().requestConfluence(route`/wiki/api/v2/pages/${pageId}?body-format=storage`);
  if (!res.ok) throw new Error(`Could not read Confluence page ${pageId} (HTTP ${res.status}).`);
  const data = await res.json();
  return htmlToText(data.body?.storage?.value ?? '');
}
