import { CUSTOMER_DPAS, PUBLISHED_VENDORS } from '../../src/data/seedData';
import type { Api } from './api';
import type { DPA, AdminState, ExtractionCheck } from './types';

/** Local preview only: an in-memory register so the UI can be built and screenshotted without Jira. */
export function createMockApi(): Api {
  const dpas: DPA[] = CUSTOMER_DPAS.map((d, i) => ({
    id: d.id, customerName: d.customerName, country: d.country, noticePeriodDays: d.noticePeriodDays, noticeUnit: d.noticeUnit,
    objectionWindowDays: d.objectionWindowDays, remedy: d.remedy, locationRestriction: d.locationRestriction, exactClause: d.exactClause,
    status: d.expectedStatus === 'unclear' ? 'unclear' : i < 26 ? 'confirmed' : 'draft', confluencePageId: `P${i + 1}`,
  }));
  const find = (id: string) => dpas.find((d) => d.id === id)!;
  const state = (): AdminState => ({
    dpaCount: dpas.length,
    vendorCount: PUBLISHED_VENDORS.length,
    confirmedCount: dpas.filter((d) => d.status === 'confirmed').length,
    unclearCount: dpas.filter((d) => d.status === 'unclear').length,
    dpas: dpas.map((d) => ({ ...d })),
    vendors: PUBLISHED_VENDORS,
  });
  const pause = (ms = 250) => new Promise((r) => setTimeout(r, ms));

  return {
    getAdminState: async () => state(),
    seedStep: async (_s, offset = 0) => {
      await pause(120);
      const next = offset + 6;
      return { logs: [], done: _s !== 'confluence' || next >= 41, nextOffset: next };
    },
    confirm: async (id) => { find(id).status = 'confirmed'; },
    confirmAll: async () => { dpas.forEach((d) => { if (d.status === 'draft') d.status = 'confirmed'; }); },
    resolve: async (id, days, unit) => { Object.assign(find(id), { noticePeriodDays: days, noticeUnit: unit, status: 'confirmed', resolvedByCounsel: true }); },
    extract: async (id): Promise<ExtractionCheck> => {
      await pause(600);
      const d = find(id);
      const unclear = d.noticeUnit === 'unclear';
      return {
        extracted: { noticePeriodDays: d.noticePeriodDays, noticeUnit: d.noticeUnit, objectionWindowDays: d.objectionWindowDays, remedy: d.remedy, locationRestriction: d.locationRestriction, exactClause: d.exactClause, clauseVerified: true, unclear },
        matches: { notice: true, unit: true, remedy: true, location: true },
      };
    },
    applyExtraction: async () => {},
    getGraphStatus: async () => ({ connected: true, lastSync: { at: new Date().toISOString(), ok: true, synced: 41, rejected: 0, linkedTickets: 2 } }),
    syncGraph: async () => ({ at: new Date().toISOString(), ok: true, synced: 41, rejected: 0, linkedTickets: 2 }),
    evalBatch: async (offset) => {
      await pause(200);
      const batch = CUSTOMER_DPAS.slice(offset, offset + 4);
      const rows = batch.map((d) => ({
        id: d.id, customerName: d.customerName, noticeOk: true, unitOk: true, terminationOk: true, locationOk: true, unclearOk: true, clauseVerbatim: true, confidentlyWrong: false,
        expected: { days: d.noticePeriodDays, unit: d.noticeUnit, termination: d.remedy === 'terminate', euUkOnly: d.locationRestriction === 'EU_UK_ONLY' },
        got: { days: d.noticePeriodDays, unit: d.noticeUnit, termination: d.remedy === 'terminate', euUkOnly: d.locationRestriction === 'EU_UK_ONLY', unclear: d.noticeUnit === 'unclear' },
      }));
      return { rows, total: 41, nextOffset: offset + batch.length, done: offset + batch.length >= 41 };
    },
  };
}
