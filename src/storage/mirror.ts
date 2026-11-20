import { ensureSpace, findPageId, findSpaceId, getPageText, upsertPage } from '../confluence/pages';
import type { DpaRecord } from '../types';
import { loadRegister, loadVendors, VendorRecord } from './register';

/**
 * A shared copy of the register, kept as a Confluence page.
 *
 * Forge storage is separate for each product install, so the Jira install and the Confluence
 * install of this app cannot see each other's data. Both can read Confluence, so the Jira
 * install (the authoritative store, where the admin page runs) publishes a snapshot there, and
 * the Rovo tools fall back to it when their own install has nothing. It is read-only for
 * everyone else: changes are only ever made in Jira.
 */
export const MIRROR_TITLE = 'Aviso Previo register (managed by the app, do not edit)';
const MARK = 'AVISO-REGISTER-V1';

interface Snapshot {
  savedAt: string;
  terms: DpaRecord[];
  vendors: VendorRecord[];
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Writes the current register to the shared page. A no-op when this install has no register. */
export async function publishRegisterMirror(): Promise<boolean> {
  const [terms, vendors] = await Promise.all([loadRegister(), loadVendors()]);
  if (terms.length === 0) return false;
  const snapshot: Snapshot = { savedAt: new Date().toISOString(), terms, vendors };
  const { id: spaceId } = await ensureSpace();
  await upsertPage(
    spaceId,
    MIRROR_TITLE,
    `<p>This page is a read-only copy of the Aviso Previo register so the app can answer from any product. Do not edit it; it is rewritten whenever the register changes in Jira.</p><p>${MARK} ${escapeHtml(JSON.stringify(snapshot))}</p>`
  );
  return true;
}

/** Reads the shared snapshot, or null if there is none or it cannot be understood. */
export async function readRegisterMirror(): Promise<Snapshot | null> {
  const spaceId = await findSpaceId();
  if (!spaceId) return null;
  const pageId = await findPageId(spaceId, MIRROR_TITLE);
  if (!pageId) return null;
  const text = await getPageText(pageId);
  const at = text.indexOf(MARK);
  if (at < 0) return null;
  const body = text.slice(text.indexOf('{', at), text.lastIndexOf('}') + 1);
  try {
    const parsed = JSON.parse(body) as Snapshot;
    return Array.isArray(parsed.terms) ? parsed : null;
  } catch {
    return null;
  }
}

/** This install's own register if it has one, otherwise the shared snapshot. */
export async function loadRegisterShared(): Promise<DpaRecord[]> {
  const own = await loadRegister();
  if (own.length > 0) return own;
  return (await readRegisterMirror().catch(() => null))?.terms ?? [];
}

export async function loadVendorsShared(): Promise<VendorRecord[]> {
  const own = await loadVendors();
  if (own.length > 0) return own;
  return (await readRegisterMirror().catch(() => null))?.vendors ?? [];
}

/** Publishes the shared copy only if there is none yet (for a register that existed before the mirror did). */
export async function ensureRegisterMirror(): Promise<void> {
  const spaceId = await findSpaceId();
  if (spaceId && (await findPageId(spaceId, MIRROR_TITLE))) return;
  await publishRegisterMirror();
}
