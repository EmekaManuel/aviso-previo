import { llm, reset, reply } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { askModel, MODELS } from '../../src/llm/chat';
import { classifyTicket } from '../../src/classification/ticketClassifier';
import { extractDPATerms } from '../../src/extraction/extractor';

beforeEach(reset);

const msgs = [{ role: 'user' as const, content: 'hi' }];

test('only exact, supported model ids are used', () => {
  for (const m of MODELS) assert.match(m, /^claude-(sonnet|opus|haiku)-\d/, m);
  assert.ok(!(MODELS as readonly string[]).includes('claude-sonnet-4-5'), 'the bare alias is rejected by Forge');
});

test('uses the first model when it is accepted', async () => {
  const seen: string[] = [];
  llm.handler = (req) => { seen.push(req.model); return reply({ ok: true }); };
  await askModel(msgs);
  assert.deepEqual(seen, [MODELS[0]]);
});

test('falls back to the next model only when the model is refused', async () => {
  const seen: string[] = [];
  llm.handler = (req) => {
    seen.push(req.model);
    if (req.model === MODELS[0]) throw new Error(`${req.model} model is not supported. Please review the supported models`);
    return reply({ ok: true });
  };
  await askModel(msgs);
  assert.deepEqual(seen, [MODELS[0], MODELS[1]]);
});

test('other failures are not retried on another model', async () => {
  const seen: string[] = [];
  llm.handler = (req) => { seen.push(req.model); throw new Error('rate limited'); };
  await assert.rejects(() => askModel(msgs), /rate limited/);
  assert.equal(seen.length, 1);
});

test('if every model is refused the error is surfaced, and callers still fall back safely', async () => {
  llm.handler = (req) => { throw new Error(`${req.model} model is not supported`); };
  await assert.rejects(() => askModel(msgs), /not supported/);
  const c = await classifyTicket('Add Glimpse session replay', 'Glimpse SDK receives payslip events', []);
  assert.match(c.reasoning, /Rule-based/);
  const e = await extractDPATerms('Supplier shall give thirty (30) calendar days notice.', 'C1', 'Acme');
  assert.match(e.error!, /not supported/);
});
