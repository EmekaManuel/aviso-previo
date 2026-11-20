import type { AdminState, EvalBatch, ExtractionCheck, SeedLog } from './types';

/**
 * Talks to the Forge resolver. When the page is opened outside Jira
 * (vite dev / preview) there is no bridge, so an in-memory sample is used.
 */
const inForge = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);

// The bridge throws on import outside Jira, so load it only when embedded.
const call = async <T,>(fn: string, payload?: Record<string, unknown>) => {
  const { invoke } = await import('@forge/bridge');
  return (await invoke(fn, payload)) as unknown as T;
};

export type Api = {
  getAdminState(): Promise<AdminState>;
  seedStep(step: 'storage' | 'jira' | 'confluence', offset?: number): Promise<{ logs: SeedLog[]; done: boolean; nextOffset?: number }>;
  confirm(id: string): Promise<void>;
  confirmAll(): Promise<void>;
  resolve(id: string, days: number, unit: 'calendar_days' | 'business_days'): Promise<void>;
  extract(id: string): Promise<ExtractionCheck>;
  applyExtraction(id: string): Promise<void>;
  evalBatch(offset: number): Promise<EvalBatch>;
};

const forgeApi: Api = {
  getAdminState: () => call('getAdminState'),
  seedStep: (step, offset = 0) => call('seedStep', { step, offset }),
  confirm: async (dpaId) => void (await call('confirmDPA', { dpaId })),
  confirmAll: async () => void (await call('confirmAllDPAs')),
  resolve: async (dpaId, noticePeriodDays, noticeUnit) => void (await call('resolveDPA', { dpaId, noticePeriodDays, noticeUnit })),
  extract: (dpaId) => call('extractContract', { dpaId }),
  applyExtraction: async (dpaId) => void (await call('applyExtraction', { dpaId })),
  evalBatch: (offset) => call('runExtractionEvaluation', { offset, size: 4 }),
};

let mock: Promise<Api> | null = null;
const loadMock = () => (mock ??= import('./mock').then((m) => m.createMockApi()));
const viaMock = <K extends keyof Api>(k: K) => (async (...a: unknown[]) => ((await loadMock())[k] as (...x: unknown[]) => unknown)(...a)) as Api[K];

export const api: Api = inForge
  ? forgeApi
  : {
      getAdminState: viaMock('getAdminState'),
      seedStep: viaMock('seedStep'),
      confirm: viaMock('confirm'),
      confirmAll: viaMock('confirmAll'),
      resolve: viaMock('resolve'),
      extract: viaMock('extract'),
      applyExtraction: viaMock('applyExtraction'),
      evalBatch: viaMock('evalBatch'),
    };

/** Loads the sample company: storage, Jira, then the Confluence pages a few at a time. */
export async function loadSample(onProgress: (message: string) => void): Promise<void> {
  onProgress('Loading the register…');
  await api.seedStep('storage');
  onProgress('Creating the Jira project and tickets…');
  await api.seedStep('jira');
  let offset = 0;
  for (;;) {
    onProgress(`Writing contract pages to Confluence… ${offset}/41`);
    const r = await api.seedStep('confluence', offset);
    if (r.done) break;
    offset = r.nextOffset ?? offset + 6;
  }
}
