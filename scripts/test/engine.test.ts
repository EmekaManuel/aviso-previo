import './helpers';
import test from 'node:test';
import assert from 'node:assert/strict';
import { addBusinessDays, addCalendarDays, calculateEarliestGoLive, formatNoticeDate } from '../../src/engine/dateCalculator';
import { evaluateHold, parseHostingRegion } from '../../src/engine/holdPolicy';
import type { DpaRecord } from '../../src/types';

const FRI = new Date('2026-11-20T00:00:00Z');

const term = (over: Partial<DpaRecord>): DpaRecord => ({
  id: 'T', customerName: 'Acme', country: 'UK', noticePeriodDays: 30, noticeUnit: 'calendar_days',
  objectionWindowDays: 14, remedy: 'good_faith_negotiation', noticeMethod: 'email', locationRestriction: 'NONE',
  exactClause: 'Supplier shall give thirty (30) calendar days notice.', status: 'confirmed', ...over,
});

test('business days skip weekends', () => {
  assert.equal(formatNoticeDate(addBusinessDays(FRI, 1)), '23 November 2026'); // Fri + 1 = Mon
  assert.equal(formatNoticeDate(addBusinessDays(FRI, 5)), '27 November 2026');
  assert.equal(addBusinessDays(FRI, 30).getUTCDay() % 6 !== 0, true);
});

test('calendar days do not skip weekends, and cross a year end', () => {
  assert.equal(formatNoticeDate(addCalendarDays(FRI, 60)), '19 January 2027');
  assert.equal(formatNoticeDate(addCalendarDays(new Date('2026-12-31T00:00:00Z'), 1)), '1 January 2027');
});

test('the longest notice wins; unclear terms are counted, never guessed', () => {
  const r = calculateEarliestGoLive(
    [term({ customerName: 'A' }), term({ customerName: 'B', noticePeriodDays: 60 }), term({ customerName: 'C', noticePeriodDays: null, noticeUnit: 'unclear' })],
    FRI,
    true
  );
  assert.equal(r.formattedDate, '19 January 2027');
  assert.equal(r.longestNoticeCustomer, 'B');
  assert.equal(r.noticeBreakdown.unclear, 1);
});

test('business-day contracts are computed in business days', () => {
  const r = calculateEarliestGoLive([term({ noticePeriodDays: 30, noticeUnit: 'business_days' })], FRI, true);
  assert.equal(r.businessDaysApplied, true);
  assert.equal(formatNoticeDate(r.earliestGoLiveDate), '1 January 2027'); // 30 business days from Fri 20 Nov
});

test('the date does not depend on the machine timezone', () => {
  const before = formatNoticeDate(addBusinessDays(new Date('2026-11-20T23:30:00Z'), 1));
  assert.equal(before, '23 November 2026');
});

test('parseHostingRegion reads common region wording', () => {
  assert.equal(parseHostingRegion('Northern Virginia (US)'), 'OUTSIDE_EU_UK');
  assert.equal(parseHostingRegion('Dublin, Ireland (EU)'), 'EU_UK');
  assert.equal(parseHostingRegion('London (UK) & Lagos (Nigeria)'), 'OUTSIDE_EU_UK');
  assert.equal(parseHostingRegion(''), 'UNKNOWN');
  assert.equal(parseHostingRegion('somewhere'), 'UNKNOWN');
});

const now = new Date('2026-11-21T00:00:00Z');
const base = { noticeStartedAt: FRI, now };

test('only counsel-confirmed terms count toward the date', () => {
  const terms = [term({ id: '1', customerName: 'A', noticePeriodDays: 30 }), term({ id: '2', customerName: 'B', noticePeriodDays: 60, status: 'draft' })];
  const h = evaluateHold({ ...base, classification: 'NEW_SUBPROCESSOR', hostingRegion: 'EU_UK', terms });
  assert.equal(h.longestNoticeDays, 30); // the unconfirmed 60-day term is not counted
  assert.equal(h.affectedCustomers, 1);
  assert.deepEqual(h.basis, { total: 2, confirmed: 1, pending: 1, unclear: 0 });
});

test('fails closed: with nothing confirmed the release is blocked, not allowed', () => {
  const none = evaluateHold({ ...base, classification: 'NEW_SUBPROCESSOR', hostingRegion: 'EU_UK', terms: [] });
  assert.equal(none.active, true);
  assert.match(none.failClosedReason!, /No customer contracts are loaded/);
  const unconfirmed = evaluateHold({ ...base, classification: 'NEW_SUBPROCESSOR', hostingRegion: 'EU_UK', terms: [term({ status: 'draft' })] });
  assert.equal(unconfirmed.active, true);
  assert.match(unconfirmed.failClosedReason!, /confirmed by counsel/);
});

test('tickets that do not change a processor never create a hold', () => {
  for (const c of ['UNRELATED', 'EXISTING_VENDOR_NO_CHANGE', 'NO_CUSTOMER_DATA'] as const) {
    const h = evaluateHold({ ...base, classification: c, hostingRegion: 'UNKNOWN', terms: [] });
    assert.equal(h.applies, false);
    assert.equal(h.active, false);
  }
});

test('a region change only affects contracts that restrict the region', () => {
  const terms = [
    term({ id: '1', customerName: 'Open Co' }),
    term({ id: '2', customerName: 'EU Only Co', locationRestriction: 'EU_UK_ONLY', noticePeriodDays: 60 }),
  ];
  const out = evaluateHold({ ...base, classification: 'LOCATION_CHANGE', hostingRegion: 'OUTSIDE_EU_UK', terms });
  assert.equal(out.affectedCustomers, 1);
  assert.equal(out.longestNoticeDays, 60);
  const stay = evaluateHold({ ...base, classification: 'LOCATION_CHANGE', hostingRegion: 'EU_UK', terms });
  assert.equal(stay.active, false);
});

test('an unreadable hosting region is treated as outside the EU/UK', () => {
  const terms = [term({ locationRestriction: 'EU_UK_ONLY' })];
  const h = evaluateHold({ ...base, classification: 'NEW_SUBPROCESSOR', hostingRegion: 'UNKNOWN', terms });
  assert.equal(h.locationConflictsCount, 1);
});

test('the window is anchored: the date does not slide as time passes, and the hold ends', () => {
  const terms = [term({ noticePeriodDays: 60 })];
  const input = { classification: 'NEW_SUBPROCESSOR' as const, hostingRegion: 'EU_UK' as const, terms, noticeStartedAt: FRI };
  const early = evaluateHold({ ...input, now: new Date('2026-11-21T00:00:00Z') });
  const late = evaluateHold({ ...input, now: new Date('2027-01-18T00:00:00Z') });
  const after = evaluateHold({ ...input, now: new Date('2027-01-20T00:00:00Z') });
  assert.equal(early.earliestGoLiveDate, '19 January 2027');
  assert.equal(late.earliestGoLiveDate, '19 January 2027');
  assert.equal(late.active, true);
  assert.equal(after.active, false);
});
