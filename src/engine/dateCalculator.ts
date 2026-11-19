import { CUSTOMER_DPAS, DPATermSeed } from '../data/seedData';

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

/**
 * Adds business days (excluding Saturdays and Sundays) to a start date.
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getTime());
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Adds calendar days to a start date.
 */
export function addCalendarDays(startDate: Date, days: number): Date {
  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formats a Date into standard plain copy (e.g., "19 January 2027").
 */
export function formatNoticeDate(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Deterministically computes earliest permitted go-live date across all applicable customer DPAs.
 *
 * Ground Rules:
 * - Dates are computed in code, never by the model.
 * - Business days are respected where the contract explicitly states business days.
 * - Longest notice period dictates the release hold date.
 */
export function calculateEarliestGoLive(
  dpas: DPATermSeed[] = CUSTOMER_DPAS,
  startDate: Date = new Date('2026-11-20T00:00:00Z'),
  vendorStoresInUS: boolean = true
): DateCalculationResult {
  let maxUnlockDate = new Date(startDate.getTime());
  let longestDays = 0;
  let longestCustomer = '';
  let businessDaysApplied = false;

  const terminationCustomers: string[] = [];
  const locationConflictCustomers: string[] = [];

  const breakdown = {
    thirtyCalendarDays: 0,
    sixtyCalendarDays: 0,
    thirtyBusinessDays: 0,
    unclear: 0,
  };

  for (const dpa of dpas) {
    // Record termination rights
    if (dpa.remedy === 'terminate') {
      terminationCustomers.push(`${dpa.customerName} (${dpa.country})`);
    }

    // Record location conflicts
    if (vendorStoresInUS && dpa.locationRestriction === 'EU_UK_ONLY') {
      locationConflictCustomers.push(`${dpa.customerName} (${dpa.country})`);
    }

    // Skip unclear/vague periods from numeric calculation (recorded for human counsel review)
    if (dpa.noticeUnit === 'unclear' || dpa.noticePeriodDays === null) {
      breakdown.unclear++;
      continue;
    }

    let customerUnlockDate: Date;
    if (dpa.noticeUnit === 'business_days') {
      breakdown.thirtyBusinessDays++;
      customerUnlockDate = addBusinessDays(startDate, dpa.noticePeriodDays);
      businessDaysApplied = true;
    } else {
      if (dpa.noticePeriodDays === 60) {
        breakdown.sixtyCalendarDays++;
      } else {
        breakdown.thirtyCalendarDays++;
      }
      customerUnlockDate = addCalendarDays(startDate, dpa.noticePeriodDays);
    }

    if (customerUnlockDate > maxUnlockDate) {
      maxUnlockDate = customerUnlockDate;
      longestDays = dpa.noticePeriodDays;
      longestCustomer = dpa.customerName;
    }
  }

  return {
    earliestGoLiveDate: maxUnlockDate,
    formattedDate: formatNoticeDate(maxUnlockDate),
    longestNoticeDays: longestDays,
    longestNoticeCustomer: longestCustomer,
    businessDaysApplied,
    customersWithTermination: terminationCustomers,
    customersWithLocationConflicts: locationConflictCustomers,
    noticeBreakdown: breakdown,
  };
}
