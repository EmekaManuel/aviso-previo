import { CUSTOMER_DPAS, PUBLISHED_VENDORS } from '../../src/data/seedData';
import type { Api } from './api';
import type { DPA, AdminState } from './types';

export function createMockApi() {
  const dpas: DPA[] = CUSTOMER_DPAS.map((d, i) => ({
    id: d.id,
    customerName: d.customerName,
    country: d.country,
    noticePeriodDays: d.noticePeriodDays,
    noticeUnit: d.noticeUnit,
    objectionWindowDays: d.objectionWindowDays,
    remedy: d.remedy,
    locationRestriction: d.locationRestriction,
    exactClause: d.exactClause,
    status: d.expectedStatus === 'unclear' ? 'unclear' : i < 26 ? 'confirmed' : 'draft',
  }));
  const state = (): AdminState => ({
    dpaCount: dpas.length,
    vendorCount: PUBLISHED_VENDORS.length,
    confirmedCount: dpas.filter((d) => d.status === 'confirmed').length,
    unclearCount: dpas.filter((d) => d.status === 'unclear' || d.noticeUnit === 'unclear').length,
    dpas: dpas.map((d) => ({ ...d })),
    vendors: PUBLISHED_VENDORS,
  });
  const api = {
    getAdminState: async () => state(),
    seed: async () => [{ stage: 'Storage: DPAs', message: 'Loaded 41 contracts and 9 vendors' }],
    confirm: async (id: string) => {
      const d = dpas.find((x) => x.id === id);
      if (d) d.status = 'confirmed';
    },
    confirmAll: async () => {
      dpas.forEach((d) => { if (d.noticeUnit !== 'unclear') d.status = 'confirmed'; });
    },
    benchmark: async () => ({
      totalContracts: 41,
      noticePeriodAccuracy: '100.0%',
      unitAccuracy: '100.0%',
      terminationRecall: '100.0% (2/2)',
      locationLimitRecall: '100.0% (3/3)',
      zeroHallucinationRate: '100.0% (0 errors)',
      unclearHandling: '100.0% (CUST-041 correctly marked as Unclear)',
      overallStatus: 'PASS',
    }),
  };
  return api as unknown as Api;
}
