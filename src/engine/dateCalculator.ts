/**
 * Notice-date arithmetic. Pure and timezone-independent (UTC): same inputs,
 * same date. The model never touches any of this.
 */

/** The part of a DPA term the date engine needs. */
export interface NoticeTerm {
  customerName: string;
  country: string;
  noticePeriodDays: number | null;
  noticeUnit: 'calendar_days' | 'business_days' | 'unclear';
  remedy: string;
  locationRestriction: string;
}

export interface DateCalculationResult {
  earliestGoLiveDate: Date;
  formattedDate: string;
  longestNoticeDays: number;
  longestNoticeCustomer: string;
  businessDaysApplied: boolean;
  customersWithTermination: string[];
  customersWithLocationConflicts: string[];
  noticeBreakdown: {
    thirtyCalendarDays: number;
    sixtyCalendarDays: number;
    thirtyBusinessDays: number;
    unclear: number;
  };
}

/** Adds business days (Saturdays and Sundays skipped). */
export function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getTime());
  let added = 0;
  while (added < days) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay(); // 0 Sunday, 6 Saturday
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

export function addCalendarDays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "19 January 2027" */
export function formatNoticeDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Earliest permitted go-live across the given terms: the longest notice wins.
 * Terms with no stated period are counted as `unclear` and never guessed.
 *
 * @param vendorStoresOutsideEuUk whether the vendor processes outside the EU/UK
 *        (decides which EU/UK-only customers are reported as conflicts).
 */
export function calculateEarliestGoLive(
  terms: NoticeTerm[],
  startDate: Date,
  vendorStoresOutsideEuUk: boolean
): DateCalculationResult {
  let maxUnlockDate = new Date(startDate.getTime());
  let longestDays = 0;
  let longestCustomer = '';
  let businessDaysApplied = false;

  const termination: string[] = [];
  const locationConflicts: string[] = [];
  const breakdown = { thirtyCalendarDays: 0, sixtyCalendarDays: 0, thirtyBusinessDays: 0, unclear: 0 };

  for (const t of terms) {
    if (t.remedy === 'terminate') termination.push(`${t.customerName} (${t.country})`);
    if (vendorStoresOutsideEuUk && t.locationRestriction === 'EU_UK_ONLY') {
      locationConflicts.push(`${t.customerName} (${t.country})`);
    }

    if (t.noticeUnit === 'unclear' || t.noticePeriodDays === null) {
      breakdown.unclear++;
      continue;
    }

    let unlock: Date;
    if (t.noticeUnit === 'business_days') {
      breakdown.thirtyBusinessDays++;
      unlock = addBusinessDays(startDate, t.noticePeriodDays);
      businessDaysApplied = true;
    } else {
      if (t.noticePeriodDays === 60) breakdown.sixtyCalendarDays++;
      else breakdown.thirtyCalendarDays++;
      unlock = addCalendarDays(startDate, t.noticePeriodDays);
    }

    if (unlock > maxUnlockDate) {
      maxUnlockDate = unlock;
      longestDays = t.noticePeriodDays;
      longestCustomer = t.customerName;
    }
  }

  return {
    earliestGoLiveDate: maxUnlockDate,
    formattedDate: formatNoticeDate(maxUnlockDate),
    longestNoticeDays: longestDays,
    longestNoticeCustomer: longestCustomer,
    businessDaysApplied,
    customersWithTermination: termination,
    customersWithLocationConflicts: locationConflicts,
    noticeBreakdown: breakdown,
  };
}
