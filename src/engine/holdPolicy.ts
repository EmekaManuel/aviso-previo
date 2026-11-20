import type { DpaRecord, HostingRegion } from '../types';
import { calculateEarliestGoLive, formatNoticeDate } from './dateCalculator';
import type { TicketClassification } from '../classification/ticketClassifier';

export interface HoldBasis {
  total: number;
  confirmed: number;
  /** Extracted, waiting for counsel to confirm. */
  pending: number;
  /** Too ambiguous to extract; counsel must decide. */
  unclear: number;
}

export interface HoldDecision {
  /** The classification can create a hold at all. */
  applies: boolean;
  /** The window is still open: block the release. */
  active: boolean;
  /** Set when the register cannot be trusted, so the release is blocked. */
  failClosedReason?: string;
  earliestGoLiveISO: string;
  earliestGoLiveDate: string;
  longestNoticeDays: number;
  longestNoticeCustomer: string;
  affectedCustomers: number;
  terminationRightsCount: number;
  terminationCustomers: string[];
  locationConflictsCount: number;
  conflictingCustomers: string[];
  /** The contract whose clause sets the date (for the "binding clause" quote). */
  bindingCustomer: DpaRecord | null;
  basis: HoldBasis;
}

export interface HoldInput {
  classification: TicketClassification;
  hostingRegion: HostingRegion;
  terms: DpaRecord[];
  /** When the notice clock started: the first time the ticket was assessed. */
  noticeStartedAt: Date;
  now: Date;
}

export const isUnclearTerm = (t: DpaRecord) =>
  t.status === 'unclear' || (t.status !== 'confirmed' && t.noticeUnit === 'unclear');

export function summariseBasis(terms: DpaRecord[]): HoldBasis {
  const confirmed = terms.filter((t) => t.status === 'confirmed').length;
  const unclear = terms.filter(isUnclearTerm).length;
  return { total: terms.length, confirmed, unclear, pending: terms.length - confirmed - unclear };
}

/**
 * Decides whether a release hold applies. Only counsel-confirmed terms count
 * toward the date. If nothing is confirmed the answer is "blocked", never "allowed".
 */
export function evaluateHold(input: HoldInput): HoldDecision {
  const { classification, hostingRegion, terms, noticeStartedAt, now } = input;
  const basis = summariseBasis(terms);
  const confirmed = terms.filter((t) => t.status === 'confirmed');

  const empty: HoldDecision = {
    applies: false,
    active: false,
    earliestGoLiveISO: noticeStartedAt.toISOString(),
    earliestGoLiveDate: formatNoticeDate(noticeStartedAt),
    longestNoticeDays: 0,
    longestNoticeCustomer: '',
    affectedCustomers: 0,
    terminationRightsCount: 0,
    terminationCustomers: [],
    locationConflictsCount: 0,
    conflictingCustomers: [],
    bindingCustomer: null,
    basis,
  };

  if (classification !== 'NEW_SUBPROCESSOR' && classification !== 'LOCATION_CHANGE') return empty;

  if (confirmed.length === 0) {
    return {
      ...empty,
      applies: true,
      active: true,
      failClosedReason:
        basis.total === 0
          ? 'No customer contracts are loaded, so notice commitments cannot be verified.'
          : 'No contract terms are confirmed by counsel yet, so notice commitments cannot be verified.',
    };
  }

  // A region we cannot read is treated as outside the EU/UK: never assume it is safe.
  const outside = hostingRegion !== 'EU_UK';

  // New vendor: every confirmed contract applies. Region change: only EU/UK-restricted ones.
  const affected =
    classification === 'NEW_SUBPROCESSOR'
      ? confirmed
      : outside
        ? confirmed.filter((t) => t.locationRestriction === 'EU_UK_ONLY')
        : [];

  if (affected.length === 0) {
    return { ...empty, applies: true, active: false };
  }

  const calc = calculateEarliestGoLive(affected, noticeStartedAt, outside);
  const binding = affected.find((t) => t.customerName === calc.longestNoticeCustomer) ?? null;

  return {
    applies: true,
    active: now < calc.earliestGoLiveDate,
    earliestGoLiveISO: calc.earliestGoLiveDate.toISOString(),
    earliestGoLiveDate: calc.formattedDate,
    longestNoticeDays: calc.longestNoticeDays,
    longestNoticeCustomer: calc.longestNoticeCustomer,
    affectedCustomers: affected.length,
    terminationRightsCount: calc.customersWithTermination.length,
    terminationCustomers: calc.customersWithTermination,
    locationConflictsCount: calc.customersWithLocationConflicts.length,
    conflictingCustomers: calc.customersWithLocationConflicts,
    bindingCustomer: binding,
    basis,
  };
}

/** Plain-language region from free text such as "Northern Virginia (US)" or "Dublin, Ireland (EU)". */
export function parseHostingRegion(text: string | null | undefined): HostingRegion {
  const t = (text || '').toLowerCase();
  if (!t.trim()) return 'UNKNOWN';
  if (/\b(us|usa|united states|virginia|oregon|ohio|california|nigeria|lagos|singapore|india|australia|brazil|canada)\b|us-(east|west)|\bus\s?(east|west)/.test(t)) {
    return 'OUTSIDE_EU_UK';
  }
  if (/\b(eu|eea|uk|united kingdom|europe)\b|germany|frankfurt|ireland|dublin|france|paris|netherlands|amsterdam|london|sweden|norway/.test(t)) {
    return 'EU_UK';
  }
  return 'UNKNOWN';
}
