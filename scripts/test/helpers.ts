/**
 * Test harness. Import this FIRST in every test file: it swaps the @forge/*
 * packages for in-memory fakes, so the real Aviso Previo modules run unmodified.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('node:module');

export const store = new Map<string, any>();

/** Records what the code sends to the Teamwork Graph. */
export const twg: { calls: any[]; respond: (req: any) => any } = {
  calls: [],
  respond: (req) => ({ success: true, results: { accepted: req.objects.map((o: any) => ({ key: { entityId: o.id } })), rejected: [] } }),
};

export const llm: { handler: (req: any) => any } = {
  handler: () => {
    throw new Error('LLM not configured for this test');
  },
};

type Resp = { ok: boolean; status: number; json: () => Promise<any> };
const resp = (body: any, status = 200): Resp => ({ ok: status < 400, status, json: async () => body });

/** A tiny Jira: issues, projects, and issue creation. */
export const jira = {
  issues: new Map<string, { summary: string; description: string }>(),
  projects: new Set<string>(['ENG']),
  created: [] as any[],
  failCreate: false,
  failRead: false,
  counter: 100,
  reset() {
    this.issues.clear();
    this.projects = new Set(['ENG']);
    this.created = [];
    this.failCreate = false;
    this.failRead = false;
    this.counter = 100;
  },
  handle(path: string, opts: any = {}): Resp {
    const issue = path.match(/^\/rest\/api\/3\/issue\/([A-Z]+-\d+)/);
    if (issue && !opts.method) {
      if (this.failRead) return resp({}, 503);
      const i = this.issues.get(issue[1]);
      if (!i) return resp({}, 404);
      return resp({
        fields: { summary: i.summary, description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: i.description }] }] } },
      });
    }
    if (path === '/rest/api/3/serverInfo') return resp({ baseUrl: 'https://example.atlassian.net/' });
    const project = path.match(/^\/rest\/api\/3\/project\/([A-Z]+)$/);
    if (project) return this.projects.has(project[1]) ? resp({ key: project[1] }) : resp({}, 404);
    if (path === '/rest/api/3/issue' && opts.method === 'POST') {
      if (this.failCreate) return resp({}, 400);
      const body = JSON.parse(opts.body);
      const key = `${body.fields.project.key}-${++this.counter}`;
      this.created.push({ key, ...body.fields });
      return resp({ key });
    }
    return resp({}, 404);
  },
};

/** A tiny Confluence: one space, pages by title. */
export const confluence = {
  pages: new Map<string, { id: string; title: string; body: string; version: number }>(),
  calls: [] as string[],
  reset() {
    this.pages.clear();
    this.calls = [];
  },
  handle(path: string, opts: any = {}): Resp {
    this.calls.push(`${opts.method || 'GET'} ${path}`);
    if (path.startsWith('/wiki/api/v2/spaces?keys=')) return resp({ results: [{ id: 'S1', key: 'CONTRACTS' }] });
    const byTitle = path.match(/^\/wiki\/api\/v2\/pages\?space-id=\w+&title=(.+)&limit=1$/);
    if (byTitle) {
      const hit = [...this.pages.values()].find((p) => p.title === byTitle[1]);
      return resp({ results: hit ? [{ id: hit.id }] : [] });
    }
    const one = path.match(/^\/wiki\/api\/v2\/pages\/(\w+)(\?body-format=storage)?$/);
    if (one) {
      const page = [...this.pages.values()].find((p) => p.id === one[1]);
      if (!page) return resp({}, 404);
      if (opts.method === 'PUT') {
        const b = JSON.parse(opts.body);
        page.body = b.body.value;
        page.version = b.version.number;
        return resp({ id: page.id });
      }
      return resp({ id: page.id, version: { number: page.version }, body: { storage: { value: page.body } } });
    }
    if (path === '/wiki/api/v2/pages' && opts.method === 'POST') {
      const b = JSON.parse(opts.body);
      const id = `P${this.pages.size + 1}`;
      this.pages.set(id, { id, title: b.title, body: b.body.value, version: 1 });
      return resp({ id });
    }
    return resp({}, 404);
  },
};

const fakes: Record<string, any> = {
  '@forge/kvs': {
    kvs: {
      get: async (k: string) => (store.has(k) ? structuredClone(store.get(k)) : undefined),
      set: async (k: string, v: any) => void store.set(k, structuredClone(v)),
      delete: async (k: string) => void store.delete(k),
    },
  },
  '@forge/api': {
    __esModule: true,
    default: {
      asApp: () => ({
        requestJira: async (p: any, o: any) => jira.handle(String(p), o),
        requestConfluence: async (p: any, o: any) => confluence.handle(String(p), o),
      }),
    },
    route: (strings: TemplateStringsArray, ...vals: any[]) => strings.reduce((acc, s, i) => acc + s + (i < vals.length ? String(vals[i]) : ''), ''),
  },
  '@forge/llm': { chat: async (req: any) => llm.handler(req) },
  '@forge/teamwork-graph': {
    graph: { setObjects: async (req: any) => { twg.calls.push(req); return twg.respond(req); } },
    types: {},
  },
};

const originalLoad = Module._load;
Module._load = function (request: string, ...rest: any[]) {
  if (fakes[request]) return fakes[request];
  return originalLoad.call(this, request, ...rest);
};

export function reset() {
  store.clear();
  twg.calls = [];
  twg.respond = (req) => ({ success: true, results: { accepted: req.objects.map((o: any) => ({ key: { entityId: o.id } })), rejected: [] } });
  jira.reset();
  confluence.reset();
  llm.handler = () => {
    throw new Error('LLM not configured for this test');
  };
}

/** What the model returns for a chat call. */
export const reply = (obj: any) => ({ choices: [{ message: { content: JSON.stringify(obj) } }], usage: { input_tokens: 10, output_tokens: 10 } });

// ── Fixtures ────────────────────────────────────────────────
import { CUSTOMER_DPAS, PUBLISHED_VENDORS } from '../../src/data/seedData';
import type { DpaRecord } from '../../src/types';

export function toRecord(d: (typeof CUSTOMER_DPAS)[number], status?: DpaRecord['status']): DpaRecord {
  const { expectedStatus, isBuriedInDataTransfer, ...terms } = d;
  return { ...terms, status: status ?? expectedStatus, confluencePageId: null };
}

/** Puts the full sample register and vendor list into the fake KVS. */
export function loadSampleRegister(opts: { onlyConfirmed?: string[] } = {}) {
  const ids: string[] = [];
  for (const d of CUSTOMER_DPAS) {
    const rec = toRecord(d);
    if (opts.onlyConfirmed) rec.status = opts.onlyConfirmed.includes(d.id) ? 'confirmed' : d.expectedStatus === 'unclear' ? 'unclear' : 'draft';
    store.set(`dpa:${d.id}`, rec);
    ids.push(d.id);
  }
  store.set('dpas:list', ids);
  store.set('vendors:list', PUBLISHED_VENDORS.map((v) => v.key));
  for (const v of PUBLISHED_VENDORS) store.set(`vendor:${v.key}`, v);
}

export { CUSTOMER_DPAS, PUBLISHED_VENDORS };
