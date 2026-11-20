import type { IssueAssessment } from './types';

const inForge = !['localhost', '127.0.0.1'].includes(window.location.hostname);

const call = async <T,>(fn: string, payload?: Record<string, unknown>) => {
  const { invoke } = await import('@forge/bridge');
  return (await invoke(fn, payload)) as unknown as T;
};

const CLAUSE =
  'Supplier shall give Customer at least 60 calendar days prior written notice of the appointment of any new Subprocessor. Customer may object within 30 days and terminate if reasonable resolution cannot be agreed.';

// Local preview only: #new (default) · #location · #quiet · #synthetic
const MOCKS: Record<string, IssueAssessment> = {
  new: { issueKey: 'ENG-2', classification: 'NEW_SUBPROCESSOR', vendor: 'Glimpse', affectedCustomers: 41, longestNoticeDays: 60, terminationRightsCount: 2, locationConflictsCount: 3, earliestGoLiveDate: '19 January 2027', sampleClauseCustomer: 'Nordic Logistics AS', sampleClauseQuote: CLAUSE },
  location: { issueKey: 'ENG-6', classification: 'LOCATION_CHANGE', vendor: 'RelayPost', earliestGoLiveDate: '19 January 2027', conflictingCustomers: ['Nordic Logistics AS (Norway)', 'Bavaria HealthTech GmbH (Germany)', 'Stockholm Retail Group AB (Sweden)'] },
  quiet: { issueKey: 'ENG-4', classification: 'EXISTING_VENDOR_NO_CHANGE', vendor: 'ErrorSentry' },
  synthetic: { issueKey: 'ENG-8', classification: 'NO_CUSTOMER_DATA', vendor: 'Glimpse' },
};

export const api = {
  getAssessment: async (): Promise<IssueAssessment> =>
    inForge ? call<IssueAssessment>('getIssueAssessment') : MOCKS[location.hash.slice(1)] ?? MOCKS.new,
  createRequest: async (p: { issueKey: string; vendor: string; earliestDate: string }): Promise<{ requestKey?: string }> =>
    inForge ? call('createLegalNoticeRequest', p) : { requestKey: 'PRIV-18' },
  override: async (p: { issueKey: string; overrideReason: string }) =>
    inForge ? void (await call('overrideIssueDecision', p)) : undefined,
};
