import { llm, reset, reply, replyBlocks, replyFenced, replyText } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { extractDPATerms } from '../../src/extraction/extractor';
import { containsClause, htmlToText } from '../../src/extraction/text';
import { scoreContract, summarise } from '../../src/evaluation/scoring';
import { buildContractHtml } from '../../src/seed/contractPage';
import { CUSTOMER_DPAS } from '../../src/data/seedData';

beforeEach(reset);

const nordic = CUSTOMER_DPAS.find((d) => d.customerName === 'Nordic Logistics AS')!;
const vague = CUSTOMER_DPAS.find((d) => d.expectedStatus === 'unclear')!;
const pageText = (d: typeof nordic) => htmlToText(buildContractHtml(d));

const modelSays = (d: typeof nordic, over: any = {}) =>
  reply({
    noticePeriodDays: d.noticePeriodDays, noticeUnit: d.noticeUnit, objectionWindowDays: d.objectionWindowDays,
    remedy: d.remedy, noticeMethod: 'email', locationRestriction: d.locationRestriction,
    exactClause: d.exactClause, isUnclear: d.noticeUnit === 'unclear', unclearReason: null, ...over,
  });

test('the contract page holds the contract text and not a summary of the terms', () => {
  const html = buildContractHtml(nordic);
  assert.ok(html.includes(nordic.exactClause.slice(0, 40)));
  assert.ok(!/Summary of Agreed Terms|Notice Period:/i.test(html), 'the page must not leak the answers');
});

test('some contracts keep the subprocessor wording under International Data Transfers', () => {
  const buried = CUSTOMER_DPAS.find((d) => d.isBuriedInDataTransfer)!;
  const html = buildContractHtml(buried);
  const transfers = html.indexOf('International Data Transfers');
  assert.ok(html.indexOf(buried.exactClause.slice(0, 30)) > transfers);
});

test('a quoted clause is verified against the contract, quote style and spacing aside', () => {
  const text = pageText(nordic);
  assert.equal(containsClause(text, nordic.exactClause), true);
  assert.equal(containsClause(text, '“' + nordic.exactClause.replace(/ /g, '  ') + '”'), true);
  assert.equal(containsClause(text, 'Supplier shall give 90 business days notice of anything at all'), false);
});

test('extracts terms and marks the clause verified', async () => {
  llm.handler = () => modelSays(nordic);
  const r = await extractDPATerms(pageText(nordic), nordic.id, nordic.customerName);
  assert.equal(r.noticePeriodDays, 60);
  assert.equal(r.clauseVerified, true);
  assert.equal(r.error, undefined);
});

test('a clause the model invented is rejected, not stored', async () => {
  llm.handler = () => modelSays(nordic, { exactClause: 'Supplier must notify Customer ninety days ahead of time.' });
  const r = await extractDPATerms(pageText(nordic), nordic.id, nordic.customerName);
  assert.equal(r.clauseVerified, false);
  assert.equal(r.exactClause, '');
});

test('a model failure is reported as an error and as unclear, never as a reading', async () => {
  llm.handler = () => { throw new Error('quota'); };
  const r = await extractDPATerms(pageText(nordic), nordic.id, nordic.customerName);
  assert.equal(r.isUnclear, true);
  assert.match(r.error!, /quota/);
});

test('scoring: a correct reading scores clean; a wrong confident one is flagged', async () => {
  llm.handler = () => modelSays(nordic);
  const text = pageText(nordic);
  const ok = scoreContract(nordic, await extractDPATerms(text, nordic.id, nordic.customerName), text);
  assert.deepEqual([ok.noticeOk, ok.unitOk, ok.terminationOk, ok.locationOk, ok.clauseVerbatim, ok.confidentlyWrong], [true, true, true, true, true, false]);

  llm.handler = () => modelSays(nordic, { noticePeriodDays: 30 });
  const bad = scoreContract(nordic, await extractDPATerms(text, nordic.id, nordic.customerName), text);
  assert.equal(bad.noticeOk, false);
  assert.equal(bad.confidentlyWrong, true);
});

test('scoring: an ambiguous clause is correct only if the model says unclear', async () => {
  const text = pageText(vague);
  llm.handler = () => modelSays(vague);
  assert.equal(scoreContract(vague, await extractDPATerms(text, vague.id, vague.customerName), text).unclearOk, true);
  llm.handler = () => modelSays(vague, { noticePeriodDays: 14, noticeUnit: 'calendar_days', isUnclear: false });
  const guessed = scoreContract(vague, await extractDPATerms(text, vague.id, vague.customerName), text);
  assert.equal(guessed.unclearOk, false);
  assert.equal(guessed.confidentlyWrong, true);
});

test('summary keeps errors out of the accuracy figures', async () => {
  llm.handler = () => modelSays(nordic);
  const text = pageText(nordic);
  const good = scoreContract(nordic, await extractDPATerms(text, nordic.id, nordic.customerName), text);
  llm.handler = () => { throw new Error('down'); };
  const failed = scoreContract(nordic, await extractDPATerms(text, nordic.id, nordic.customerName), text);
  const s = summarise([good, failed]);
  assert.equal(s.contracts, 2);
  assert.equal(s.scored, 1);
  assert.equal(s.errors, 1);
  assert.equal(s.noticeCorrect, 1);
});

test('reads the contract terms whatever shape the model reply arrives in', async () => {
  const body = { noticePeriodDays: nordic.noticePeriodDays, noticeUnit: nordic.noticeUnit, objectionWindowDays: nordic.objectionWindowDays, remedy: nordic.remedy, noticeMethod: 'email', locationRestriction: nordic.locationRestriction, exactClause: nordic.exactClause, isUnclear: false, unclearReason: null };
  for (const response of [reply(body), replyBlocks(body), replyFenced(body)]) {
    llm.handler = () => response;
    const r = await extractDPATerms(pageText(nordic), nordic.id, nordic.customerName);
    assert.equal(r.error, undefined);
    assert.equal(r.noticePeriodDays, 60);
    assert.equal(r.clauseVerified, true);
  }
});

test('a reply that does not contain the terms is an error, not a silent "unclear"', async () => {
  llm.handler = () => replyText('{"note":"I could not find anything"}');
  const r = await extractDPATerms(pageText(nordic), nordic.id, nordic.customerName);
  assert.match(r.error!, /did not contain the contract terms/);
});
