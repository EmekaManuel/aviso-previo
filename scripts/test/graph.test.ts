import { store, twg, jira, llm, reset, reply, loadSampleRegister } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { onConnectionChange, syncContractsToGraph, getGraphStatus, buildContractObject } from '../../src/graph/contractGraph';
import { assessIssue } from '../../src/assessment/assessIssue';
import { toRecord, CUSTOMER_DPAS } from './helpers';

beforeEach(() => {
  reset();
  loadSampleRegister();
});

const connect = () => onConnectionChange({ action: 'CREATED', name: 'Aviso Previo Contracts', connectionId: 'conn-1' });

test('does nothing until an admin has connected the connector', async () => {
  assert.equal(await syncContractsToGraph(), null);
  assert.equal(twg.calls.length, 0);
  assert.equal((await getGraphStatus()).connected, false);
});

test('connecting stores the connection id and syncs every contract as a document', async () => {
  const r = await connect();
  assert.equal(r.success, true);
  assert.equal(twg.calls.length, 1);
  assert.equal(twg.calls[0].connectionId, 'conn-1');
  assert.equal(twg.calls[0].objects.length, 41);
  const s = await getGraphStatus();
  assert.equal(s.connected, true);
  assert.equal(s.lastSync!.synced, 41);
  assert.equal(s.lastSync!.ok, true);
});

test('each contract is a workspace-visible document that keeps its clause', async () => {
  await connect();
  const nordic = twg.calls[0].objects.find((o: any) => o.displayName === 'DPA: Nordic Logistics AS');
  assert.equal(nordic.id, 'dpa-' + CUSTOMER_DPAS.find((d) => d.customerName === 'Nordic Logistics AS')!.id);
  assert.deepEqual(nordic.permissions, [{ accessControls: [{ principals: [{ type: 'ATLASSIAN_WORKSPACE' }] }] }]);
  assert.match(nordic['atlassian:document'].content.text, /60 calendar days|sixty/i);
  assert.ok(nordic['atlassian:document'].labels.includes('termination-right'));
  assert.ok(nordic['atlassian:document'].labels.includes('eu-uk-only'));
  assert.equal(nordic.associations, undefined, 'no ticket yet, so no association');
});

test('contracts are linked to the tickets whose hold binds them', async () => {
  await connect();
  jira.issues.set('ENG-5', { summary: 'Use Zorbly', description: 'payslip data' });
  llm.handler = () => reply({ classification: 'NEW_SUBPROCESSOR', vendor: 'Zorbly', hostingRegion: 'OUTSIDE_EU_UK', touchesCustomerData: true, reasoning: 't' });
  twg.calls = [];
  await assessIssue('ENG-5'); // a new hold-creating ticket triggers a sync

  assert.equal(twg.calls.length, 1);
  const objs = twg.calls[0].objects;
  const linked = objs.filter((o: any) => o.associations);
  assert.equal(linked.length, 40, 'the 40 confirmed contracts are bound; the unclear one is not');
  assert.deepEqual(linked[0].associations.set, [{ associationType: 'issueIdOrKeys', values: ['ENG-5'] }]);
  assert.ok(linked[0].associations.lastUpdatedAt);
  assert.equal((await getGraphStatus()).lastSync!.linkedTickets, 1);
});

test('a region change links only the EU/UK-restricted contracts', async () => {
  await connect();
  jira.issues.set('ENG-6', { summary: 'Move RelayPost to US', description: 'US-East' });
  llm.handler = () => reply({ classification: 'LOCATION_CHANGE', vendor: 'RelayPost', hostingRegion: 'OUTSIDE_EU_UK', touchesCustomerData: true, reasoning: 't' });
  twg.calls = [];
  await assessIssue('ENG-6');
  assert.equal(twg.calls[0].objects.filter((o: any) => o.associations).length, 3);
});

test('tickets that bind nothing do not trigger a sync or an association', async () => {
  await connect();
  jira.issues.set('ENG-9', { summary: 'Fix CSS', description: 'padding' });
  llm.handler = () => reply({ classification: 'UNRELATED', vendor: null, hostingRegion: 'UNKNOWN', touchesCustomerData: false, reasoning: 't' });
  twg.calls = [];
  await assessIssue('ENG-9');
  assert.equal(twg.calls.length, 0);
});

test('rejected objects are reported, not hidden', async () => {
  await connect();
  twg.respond = (req) => ({ success: true, results: { accepted: [], rejected: req.objects.slice(0, 2).map((o: any) => ({ key: { entityId: o.id }, errors: [{ message: 'bad url' }] })) } });
  const s = await syncContractsToGraph();
  assert.equal(s!.ok, false);
  assert.equal(s!.rejected, 2);
  assert.match(s!.message!, /bad url/);
});

test('a refused request is recorded as a failed sync', async () => {
  await connect();
  twg.respond = () => ({ success: false, error: 'quota exceeded' });
  const s = await syncContractsToGraph();
  assert.equal(s!.ok, false);
  assert.match(s!.message!, /quota exceeded/);
});

test('disconnecting clears the connection and status', async () => {
  await connect();
  await onConnectionChange({ action: 'DELETED', name: 'Aviso Previo Contracts', connectionId: 'conn-1' });
  assert.equal((await getGraphStatus()).connected, false);
  assert.equal(store.has('graph:lastSync'), false);
});

test('an unclear contract is described honestly', () => {
  const unclear = CUSTOMER_DPAS.find((d) => d.expectedStatus === 'unclear')!;
  const o: any = buildContractObject(toRecord(unclear), [], 'https://x.atlassian.net', 1, '2026-11-20T00:00:00Z');
  assert.match(o.description, /counsel to decide/);
});
