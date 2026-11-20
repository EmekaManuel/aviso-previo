import type { AdminState, Benchmark, SeedLog } from './types';

/**
 * Talks to the Forge resolver. When the page is opened outside Jira
 * (vite dev / preview) there is no bridge, so an in-memory sample is used.
 */
const inForge = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);

export type Api = {
  getAdminState(): Promise<AdminState>;
  seed(): Promise<SeedLog[]>;
  confirm(id: string): Promise<void>;
  confirmAll(): Promise<void>;
  benchmark(): Promise<Benchmark>;
};

// The bridge throws on import outside Jira, so load it only when embedded.
const call = async <T,>(fn: string, payload?: Record<string, unknown>) => {
  const { invoke } = await import('@forge/bridge');
  return (await invoke(fn, payload)) as unknown as T;
};

const forgeApi: Api = {
  getAdminState: () => call<AdminState>('getAdminState'),
  seed: async () => ((await call<{ logs?: SeedLog[] }>('seedAyoPayroll'))?.logs ?? []),
  confirm: async (dpaId) => void (await call('confirmDPA', { dpaId })),
  confirmAll: async () => void (await call('confirmAllDPAs')),
  benchmark: () => call<Benchmark>('getExtractionBenchmarkScore'),
};

let mock: Promise<Api> | null = null;
const loadMock = () => (mock ??= import('./mock').then((m) => m.createMockApi()));

export const api: Api = inForge
  ? forgeApi
  : {
      getAdminState: async () => (await loadMock()).getAdminState(),
      seed: async () => (await loadMock()).seed(),
      confirm: async (id) => (await loadMock()).confirm(id),
      confirmAll: async () => (await loadMock()).confirmAll(),
      benchmark: async () => (await loadMock()).benchmark(),
    };
