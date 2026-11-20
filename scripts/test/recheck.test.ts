import { store, jira, llm, reset, reply, loadSampleRegister } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from '../../src/resolvers';
import { assessIssue } from '../../src/assessment/assessIssue';

beforeEach(() => {
  reset();
  loadSampleRegister();
  jira.issues.set('ENG-1', { summary: 'Add session replay using Glimpse', description: 'Glimpse SDK receives payslip events, hosted in the US' });
});

const req = { context: { extension: { issue: { key: 'ENG-1' } }, accountId: 'abc' } };
const glimpse = () => reply({ classification: 'NEW_SUBPROCESSOR', vendor: 'Glimpse', hostingRegion: 'OUTSIDE_EU_UK', touchesCustomerData: true, reasoning: 'ok' });

test('re-checking replaces a wrong earlier reading', async () => {
  llm.handler = () => reply({ classification: 'UNRELATED', vendor: null, hostingRegion: 'UNKNOWN', touchesCustomerData: false, reasoning: 'wrong' });
  assert.equal((await assessIssue('ENG-1')).classification, 'UNRELATED');
  llm.handler = glimpse;
  const fresh = await handler.reassessIssue(req);
  assert.equal(fresh.classification, 'NEW_SUBPROCESSOR');
  assert.equal(fresh.holdActive, true);
});

test('re-checking keeps a counsel override and a linked privacy request', async () => {
  llm.handler = glimpse;
  await assessIssue('ENG-1');
  store.set('decision:ENG-1', { ...store.get('decision:ENG-1'), overridden: true, overrideReason: 'addendum signed', overriddenBy: 'Counsel', legalRequestKey: 'PRIV-7' });
  const fresh = await handler.reassessIssue(req);
  assert.equal(fresh.overridden, true);
  assert.equal(fresh.overrideReason, 'addendum signed');
  assert.equal(fresh.legalRequestKey, 'PRIV-7');
});

test('re-checking does not restart a notice clock that is already running', async () => {
  llm.handler = glimpse;
  await assessIssue('ENG-1');
  const started = new Date(Date.now() - 20 * 86400000).toISOString();
  store.set('decision:ENG-1', { ...store.get('decision:ENG-1'), noticeStartedAt: started });
  const fresh = await handler.reassessIssue(req);
  assert.equal(fresh.noticeStartedAt, started);
});

test('re-checking outside a Jira issue is an error', async () => {
  await assert.rejects(() => handler.reassessIssue({ context: {} }), /not on a Jira issue/);
});

test('confirming synthetic data is recorded with who confirmed it, and only on a synthetic ticket', async () => {
  llm.handler = () => reply({ classification: 'NO_CUSTOMER_DATA', vendor: 'Glimpse', hostingRegion: 'UNKNOWN', touchesCustomerData: false, reasoning: 'ok' });
  const before = await assessIssue('ENG-1');
  assert.equal(before.syntheticConfirmed, false);
  const after = await handler.confirmSyntheticData(req);
  assert.equal(after.syntheticConfirmed, true);
  assert.match(after.syntheticConfirmedBy, /Counsel/);
  assert.ok(store.get('decision:ENG-1').syntheticConfirmedAt);

  reset();
  loadSampleRegister();
  jira.issues.set('ENG-1', { summary: 'x', description: 'y' });
  llm.handler = glimpse;
  await assert.rejects(() => handler.confirmSyntheticData(req), /not classed as synthetic-data-only/);
});

test('re-checking clears a synthetic confirmation, so a changed ticket must be confirmed again', async () => {
  llm.handler = () => reply({ classification: 'NO_CUSTOMER_DATA', vendor: 'Glimpse', hostingRegion: 'UNKNOWN', touchesCustomerData: false, reasoning: 'ok' });
  await assessIssue('ENG-1');
  await handler.confirmSyntheticData(req);
  const fresh = await handler.reassessIssue(req);
  assert.equal(fresh.syntheticConfirmed, false);
});
