import { invoke } from '@forge/bridge';
import type { AdminState, Benchmark, SeedLog } from './types';

/**
 * Talks to the Forge resolver. When the page is opened outside Jira
 * (vite dev / preview) there is no bridge, so an in-memory sample is used.
 */
const inForge = typeof window !== 'undefined' && window.self !== window.top;

export type Api = {
  getAdminState(): Promise<AdminState>;
  seed(): Promise<SeedLog[]>;
  confirm(id: string): Promise<void>;
  confirmAll(): Promise<void>;
  benchmark(): Promise<Benchmark>;
};

const forgeApi: Api = {
  getAdminState: () => invoke<AdminState>('getAdminState'),
  seed: async () => ((await invoke<{ logs?: SeedLog[] }>('seedAyoPayroll'))?.logs ?? []),
  confirm: async (dpaId) => void (await invoke('confirmDPA', { dpaId })),
  confirmAll: async () => void (await invoke('confirmAllDPAs')),
  benchmark: () => invoke<Benchmark>('getExtractionBenchmarkScore'),
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
