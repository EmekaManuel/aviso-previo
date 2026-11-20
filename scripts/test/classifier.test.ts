import { llm, reset, reply, replyBlocks, replyFenced, replyText, PUBLISHED_VENDORS } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTicket } from '../../src/classification/ticketClassifier';
import tickets from '../../src/data/ticketTestSet.json';

beforeEach(reset);

test('uses the model reply when it is valid, including the hosting region', async () => {
  llm.handler = () => reply({ classification: 'NEW_SUBPROCESSOR', vendor: 'Glimpse', hostingRegion: 'OUTSIDE_EU_UK', touchesCustomerData: true, reasoning: 'x' });
  const r = await classifyTicket('Add Glimpse', 'session replay', PUBLISHED_VENDORS);
  assert.equal(r.classification, 'NEW_SUBPROCESSOR');
  assert.equal(r.hostingRegion, 'OUTSIDE_EU_UK');
});

test('falls back to rules when the model errors or returns junk', async () => {
  llm.handler = () => { throw new Error('AI not enabled'); };
  const a = await classifyTicket('Add Glimpse session replay', 'receives employee payslip events', PUBLISHED_VENDORS);
  assert.match(a.reasoning, /Rule-based/);
  llm.handler = () => ({ choices: [{ message: { content: 'no json here' } }] });
  const b = await classifyTicket('Fix CSS bug on payslip', 'padding', PUBLISHED_VENDORS);
  assert.match(b.reasoning, /Rule-based/);
});

type Row = { id: string; summary: string; description: string; expectedClassification: string };

test('fallback rules on the 30 labelled tickets: never miss a new subprocessor', async () => {
  llm.handler = () => { throw new Error('rules only'); };
  const rows = tickets as Row[];
  let correct = 0, newTotal = 0, newFound = 0;
  const wrong: string[] = [];
  for (const t of rows) {
    const r = await classifyTicket(t.summary, t.description, PUBLISHED_VENDORS);
    if (r.classification === t.expectedClassification) correct++;
    else wrong.push(`${t.id}: expected ${t.expectedClassification}, got ${r.classification}`);
    if (t.expectedClassification === 'NEW_SUBPROCESSOR') {
      newTotal++;
      if (r.classification === 'NEW_SUBPROCESSOR') newFound++;
    }
  }
  console.log(`  fallback rules: ${correct}/${rows.length} correct; new subprocessors found ${newFound}/${newTotal}`);
  wrong.forEach((w) => console.log('    ' + w));
  assert.equal(newFound, newTotal, 'a new subprocessor must never be missed');
  assert.ok(correct / rows.length >= 0.7, `fallback accuracy ${correct}/${rows.length} fell below 70%`);
});

const glimpse = { classification: 'NEW_SUBPROCESSOR', vendor: 'Glimpse', hostingRegion: 'OUTSIDE_EU_UK', touchesCustomerData: true, reasoning: 'x' };
const ticket = [
  'Add session replay to the payslip screen using Glimpse (fictional vendor) to debug layout bugs',
  'We will integrate Glimpse session replay SDK onto the payslip screens. Glimpse hosts data on their US multi-tenant cluster.',
] as const;

test('reads the model reply whatever shape the content arrives in', async () => {
  for (const [name, response] of [
    ['plain string', reply(glimpse)],
    ['content blocks', replyBlocks(glimpse)],
    ['fenced json with prose', replyFenced(glimpse)],
  ] as const) {
    llm.handler = () => response;
    const r = await classifyTicket(...ticket, PUBLISHED_VENDORS);
    assert.equal(r.classification, 'NEW_SUBPROCESSOR', name);
    assert.equal(r.reasoning, 'x', name + ' should be the model reading, not the rules');
  }
});

test('a reply without a usable classification falls back to the rules, never to UNRELATED', async () => {
  for (const bad of [replyText('{"vendor":"Glimpse"}'), replyText('{"classification":"maybe"}'), replyText('{}'), { choices: [{ message: { content: [] } }] }, { choices: [] }]) {
    llm.handler = () => bad;
    const r = await classifyTicket(...ticket, PUBLISHED_VENDORS);
    assert.match(r.reasoning, /Rule-based/);
    assert.equal(r.classification, 'NEW_SUBPROCESSOR');
  }
});
