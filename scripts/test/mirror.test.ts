import { store, confluence, jira, llm, reset, reply, loadSampleRegister } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { publishRegisterMirror, readRegisterMirror, loadRegisterShared, MIRROR_TITLE } from '../../src/storage/mirror';
import { checkSubprocessorAction, explainTermAction, openNoticeAction } from '../../src/rovo/actions';
import { handler } from '../../src/resolvers';

beforeEach(() => {
  reset();
  loadSampleRegister();
});

/** What the Confluence install of the app sees: its own (empty) storage, the same Confluence. */
const asConfluenceInstall = () => store.clear();

test('publishing writes one read-only page that holds the whole register', async () => {
  assert.equal(await publishRegisterMirror(), true);
  const pages = [...confluence.pages.values()].filter((p) => p.title === MIRROR_TITLE);
  assert.equal(pages.length, 1);
  assert.match(pages[0].body, /AVISO-REGISTER-V1/);
  assert.match(pages[0].body, /Do not edit/);
});

test('publishing again updates the same page instead of adding another', async () => {
  await publishRegisterMirror();
  await publishRegisterMirror();
  assert.equal([...confluence.pages.values()].filter((p) => p.title === MIRROR_TITLE).length, 1);
});

test('nothing is published from an install that has no register', async () => {
  asConfluenceInstall();
  assert.equal(await publishRegisterMirror(), false);
  assert.equal(confluence.pages.size, 0);
});

test('the snapshot survives the round trip, including quotes, ampersands and angle brackets', async () => {
  const tricky = store.get('dpa:CUST-001');
  store.set('dpa:CUST-001', { ...tricky, customerName: 'Smith & Sons <Ltd>', exactClause: 'Supplier shall give "thirty (30)" days “notice” & not less.' });
  await publishRegisterMirror();
  asConfluenceInstall();
  const snap = await readRegisterMirror();
  const back = snap!.terms.find((t) => t.id === 'CUST-001')!;
  assert.equal(back.customerName, 'Smith & Sons <Ltd>');
  assert.equal(back.exactClause, 'Supplier shall give "thirty (30)" days “notice” & not less.');
  assert.equal(snap!.terms.length, 41);
  assert.equal(snap!.vendors.length, 9);
});

test('the Confluence-side agent answers from the shared copy when its own storage is empty', async () => {
  await publishRegisterMirror();
  asConfluenceInstall();
  const r: any = await checkSubprocessorAction({ inputs: { vendor: 'Glimpse', hostingLocation: 'United States' } });
  assert.equal(r.success, true);
  assert.equal(r.confirmedCustomerDpas, 40);
  assert.equal(r.longestNoticeDays, 60);
  const e: any = await explainTermAction({ inputs: { customerName: 'Nordic Logistics' } });
  assert.equal(e.success, true);
  assert.equal(e.noticePeriodDays, 60);
  const unclear: any = await explainTermAction({ inputs: { customerName: 'CUST-041' } });
  assert.match(unclear.explanation, /counsel to decide/);
});

test('the install that owns the register always uses its own copy, not the snapshot', async () => {
  await publishRegisterMirror();
  store.set('dpa:CUST-001', { ...store.get('dpa:CUST-001'), customerName: 'Changed After Publishing' });
  const terms = await loadRegisterShared();
  assert.equal(terms.find((t) => t.id === 'CUST-001')!.customerName, 'Changed After Publishing');
});

test('opening a privacy request from the other install is refused, with a pointer to Jira', async () => {
  await publishRegisterMirror();
  asConfluenceInstall();
  const r: any = await openNoticeAction({ inputs: { issueKey: 'ENG-1' } });
  assert.equal(r.success, false);
  assert.match(r.error, /kept in Jira/);
  assert.equal(jira.created.length, 0);
});

test('with no register anywhere the agent says how to load one', async () => {
  asConfluenceInstall();
  const r: any = await checkSubprocessorAction({ inputs: { vendor: 'Glimpse' } });
  assert.equal(r.success, false);
  assert.match(r.error, /Aviso Previo Admin in Jira/);
});

test('an unreadable snapshot is treated as no snapshot', async () => {
  await publishRegisterMirror();
  const page = [...confluence.pages.values()].find((p) => p.title === MIRROR_TITLE)!;
  page.body = '<p>AVISO-REGISTER-V1 {"terms": [oops</p>';
  asConfluenceInstall();
  assert.equal(await readRegisterMirror(), null);
  assert.equal((await loadRegisterShared()).length, 0);
});

test('changing the register in Jira refreshes the shared copy', async () => {
  await publishRegisterMirror();
  store.set('dpa:CUST-002', { ...store.get('dpa:CUST-002'), status: 'draft', confirmedAt: null });
  await handler.confirmDPA({ payload: { dpaId: 'CUST-002' }, context: { accountId: 'abc' } });
  asConfluenceInstall();
  const snap = await readRegisterMirror();
  assert.equal(snap!.terms.find((t) => t.id === 'CUST-002')!.status, 'confirmed');
});

test('opening the admin page creates the shared copy for a register that predates it, once', async () => {
  assert.equal(confluence.pages.size, 0);
  await handler.getAdminState({ payload: {}, context: {} });
  assert.equal([...confluence.pages.values()].filter((p) => p.title === MIRROR_TITLE).length, 1);
  const writes = confluence.calls.filter((c) => c.startsWith('POST') || c.startsWith('PUT')).length;
  await handler.getAdminState({ payload: {}, context: {} });
  assert.equal(confluence.calls.filter((c) => c.startsWith('POST') || c.startsWith('PUT')).length, writes, 'the second open must not rewrite it');
});
