import { store, jira, llm, reset, reply, loadSampleRegister } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkSubprocessorAction, explainTermAction, openNoticeAction } from '../../src/rovo/actions';

beforeEach(() => {
  reset();
  loadSampleRegister();
});

test('every response carries the disclaimer', async () => {
  const r = await checkSubprocessorAction({ inputs: {} });
  assert.equal(r.success, false);
  assert.match(r.disclaimer, /not legal advice/);
});

test('check: an unknown vendor is a new subprocessor, with a date from the confirmed register', async () => {
  const r: any = await checkSubprocessorAction({ inputs: { vendor: 'Glimpse', hostingLocation: 'United States' } });
  assert.equal(r.status, 'NEW_SUBPROCESSOR');
  assert.equal(r.requiresPriorNotice, true);
  assert.equal(r.confirmedCustomerDpas, 40);
  assert.equal(r.longestNoticeDays, 60);
  assert.equal(r.locationConflictsCount, 3);
  assert.ok(r.earliestGoLiveDate);
});

test('check: an approved vendor with no hosting change needs no notice', async () => {
  const r: any = await checkSubprocessorAction({ inputs: { vendor: 'ErrorSentry' } });
  assert.equal(r.isApprovedVendor, true);
  assert.equal(r.requiresPriorNotice, false);
});

test('check: moving an EU vendor to the US is a location change', async () => {
  const r: any = await checkSubprocessorAction({ inputs: { vendor: 'RelayPost', hostingLocation: 'US-East' } });
  assert.equal(r.status, 'LOCATION_CHANGE');
  assert.equal(r.requiresPriorNotice, true);
});

test('check: an empty register is an error, not an invented answer', async () => {
  reset();
  const r: any = await checkSubprocessorAction({ inputs: { vendor: 'Glimpse' } });
  assert.equal(r.success, false);
  assert.match(r.error, /No customer contracts/);
});

test('explain: returns the verbatim clause for a customer', async () => {
  const r: any = await explainTermAction({ inputs: { customerName: 'Nordic Logistics' } });
  assert.equal(r.success, true);
  assert.equal(r.noticePeriodDays, 60);
  assert.match(r.exactClauseQuote, /60 calendar days|sixty/i);
});

test('explain: an ambiguous clause says counsel must decide', async () => {
  const r: any = await explainTermAction({ inputs: { customerName: 'CUST-041' } });
  assert.equal(r.success, true);
  assert.match(r.explanation, /counsel to decide/);
});

test('explain: unknown customer and missing input are errors', async () => {
  assert.equal(((await explainTermAction({ inputs: { customerName: 'Nobody Ltd' } })) as any).success, false);
  assert.equal(((await explainTermAction({ inputs: {} })) as any).success, false);
});

const newVendorTicket = () => {
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  llm.handler = () => reply({ classification: 'NEW_SUBPROCESSOR', vendor: 'Zorbly', hostingRegion: 'OUTSIDE_EU_UK', touchesCustomerData: true, reasoning: 't' });
};

test('open request: creates a real Jira issue in the ticket project when PRIV does not exist', async () => {
  newVendorTicket();
  const r: any = await openNoticeAction({ inputs: { issueKey: 'eng-5' } });
  assert.equal(r.success, true);
  assert.equal(r.legalRequestKey, 'ENG-101');
  assert.equal(jira.created.length, 1);
  assert.equal(jira.created[0].labels[0], 'privacy-notice');
  assert.match(r.draftNoticeEmail.subject, /Zorbly/);
});

test('open request: uses project PRIV when it exists, and is idempotent', async () => {
  jira.projects.add('PRIV');
  newVendorTicket();
  const a: any = await openNoticeAction({ inputs: { issueKey: 'ENG-5' } });
  const b: any = await openNoticeAction({ inputs: { issueKey: 'ENG-5' } });
  assert.equal(a.legalRequestKey, 'PRIV-101');
  assert.equal(b.legalRequestKey, 'PRIV-101');
  assert.equal(jira.created.length, 1);
  assert.equal(store.get('decision:ENG-5').legalRequestKey, 'PRIV-101');
});

test('open request: if Jira refuses, it fails and does not make up a key', async () => {
  newVendorTicket();
  jira.failCreate = true;
  const r: any = await openNoticeAction({ inputs: { issueKey: 'ENG-5' } });
  assert.equal(r.success, false);
  assert.equal(r.legalRequestKey, undefined);
  assert.equal(store.get('decision:ENG-5').legalRequestKey, undefined);
});

test('open request: a ticket that changes no processor gets no request', async () => {
  jira.issues.set('ENG-5', { summary: 'Fix CSS', description: 'padding' });
  llm.handler = () => reply({ classification: 'UNRELATED', vendor: null, hostingRegion: 'UNKNOWN', touchesCustomerData: false, reasoning: 't' });
  const r: any = await openNoticeAction({ inputs: { issueKey: 'ENG-5' } });
  assert.equal(r.success, false);
  assert.equal(jira.created.length, 0);
});
