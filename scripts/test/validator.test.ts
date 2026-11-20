import { store, jira, llm, reset, reply, loadSampleRegister, toRecord, CUSTOMER_DPAS } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateTransition, isReleaseTransition } from '../../src/validator';

const toDone = (key: string) => ({ issue: { key }, transition: { name: 'Done', to: { name: 'Done', statusCategory: { key: 'done' } } } });
const toProgress = (key: string) => ({ issue: { key }, transition: { name: 'Start', to: { name: 'In Progress' } } });

const classifyAs = (classification: string, vendor: string | null, hostingRegion = 'OUTSIDE_EU_UK') => {
  llm.handler = () => reply({ classification, vendor, targetLocation: null, hostingRegion, touchesCustomerData: true, reasoning: 'test' });
};

beforeEach(() => {
  reset();
  loadSampleRegister();
});

test('blocks a new subprocessor on any ticket key, with numbers computed from the register', async () => {
  jira.issues.set('ZZZ-77', { summary: 'Add Zorbly analytics to the payslip page', description: 'Zorbly SDK receives employee payslip events' });
  classifyAs('NEW_SUBPROCESSOR', 'Zorbly');
  const r = await validateTransition(toDone('ZZZ-77'));
  assert.equal(r.result, false);
  assert.match(r.errorMessage!, /ZZZ-77/);
  assert.match(r.errorMessage!, /Zorbly/);
  assert.match(r.errorMessage!, /40 customer DPA/); // 40 confirmed in the sample register, not a fixed 41
  assert.match(r.errorMessage!, /longest: 60 days/);
});

test('the numbers follow the register: with 3 confirmed contracts the message says 3', async () => {
  const ids = ['CUST-001', 'CUST-002', 'CUST-003'];
  loadSampleRegister({ onlyConfirmed: ids });
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  classifyAs('NEW_SUBPROCESSOR', 'Zorbly');
  const r = await validateTransition(toDone('ENG-5'));
  assert.match(r.errorMessage!, /3 customer DPA/);
  assert.match(r.errorMessage!, /longest: 30 days/);
  assert.match(r.errorMessage!, /awaiting counsel review/);
});

test('moving work along (In Progress) is never blocked', async () => {
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  classifyAs('NEW_SUBPROCESSOR', 'Zorbly');
  assert.equal((await validateTransition(toProgress('ENG-5'))).result, true);
  assert.equal(isReleaseTransition(toProgress('ENG-5')), false);
});

test('unrelated and routine tickets pass', async () => {
  for (const c of ['UNRELATED', 'EXISTING_VENDOR_NO_CHANGE', 'NO_CUSTOMER_DATA']) {
    reset();
    loadSampleRegister();
    jira.issues.set('ENG-9', { summary: 'x', description: 'y' });
    classifyAs(c, null);
    assert.equal((await validateTransition(toDone('ENG-9'))).result, true, c);
  }
});

test('a region change is blocked only because EU/UK-only contracts exist', async () => {
  jira.issues.set('ENG-6', { summary: 'Move RelayPost to US', description: 'route via US-East' });
  classifyAs('LOCATION_CHANGE', 'RelayPost');
  const r = await validateTransition(toDone('ENG-6'));
  assert.equal(r.result, false);
  assert.match(r.errorMessage!, /outside the EU\/UK/);
  assert.match(r.errorMessage!, /3 customer DPA/); // the three EU/UK-only contracts
});

test('counsel override releases the ticket and the reason is on record', async () => {
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  classifyAs('NEW_SUBPROCESSOR', 'Zorbly');
  assert.equal((await validateTransition(toDone('ENG-5'))).result, false);
  const decision = store.get('decision:ENG-5');
  store.set('decision:ENG-5', { ...decision, overridden: true, overrideReason: 'EU residency addendum signed' });
  assert.equal((await validateTransition(toDone('ENG-5'))).result, true);
});

test('the hold ends once the notice window has passed', async () => {
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  classifyAs('NEW_SUBPROCESSOR', 'Zorbly');
  await validateTransition(toDone('ENG-5')); // stores the decision
  const decision = store.get('decision:ENG-5');
  store.set('decision:ENG-5', { ...decision, noticeStartedAt: new Date(Date.now() - 90 * 86400000).toISOString() });
  assert.equal((await validateTransition(toDone('ENG-5'))).result, true);
});

test('fails closed when no contract term is confirmed', async () => {
  for (const d of CUSTOMER_DPAS) store.set(`dpa:${d.id}`, toRecord(d, 'draft'));
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  classifyAs('NEW_SUBPROCESSOR', 'Zorbly');
  const r = await validateTransition(toDone('ENG-5'));
  assert.equal(r.result, false);
  assert.match(r.errorMessage!, /confirmed by counsel/);
});

test('fails closed when the ticket cannot be read', async () => {
  jira.failRead = true;
  const r = await validateTransition(toDone('ENG-5'));
  assert.equal(r.result, false);
  assert.match(r.errorMessage!, /Unable to verify/);
});

test('the same ticket gives the same answer on the second call without re-classifying', async () => {
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  let calls = 0;
  llm.handler = () => {
    calls++;
    return reply({ classification: 'NEW_SUBPROCESSOR', vendor: 'Zorbly', hostingRegion: 'OUTSIDE_EU_UK', touchesCustomerData: true, reasoning: 't' });
  };
  const a = await validateTransition(toDone('ENG-5'));
  const b = await validateTransition(toDone('ENG-5'));
  assert.deepEqual(a, b);
  assert.equal(calls, 1);
});
