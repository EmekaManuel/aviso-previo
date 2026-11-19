import { kvs } from '@forge/kvs';
import { CUSTOMER_DPAS, PUBLISHED_VENDORS } from '../data/seedData';
import { calculateEarliestGoLive } from '../engine/dateCalculator';
import { createOrFetchLegalRequest, generateDraftCustomerNotice } from '../legal/legalRequest';

export interface ActionPayload {
  inputs?: Record<string, any>;
  [key: string]: any;
}

/**
 * Helper to extract inputs regardless of whether payload has .inputs or direct properties
 */
function getInputs(payload: ActionPayload): Record<string, any> {
  return payload.inputs || payload || {};
}

/**
 * Action 1: check-subprocessor-commitments
 * Checks vendor against customer DPAs, returns earliest go-live date, affected counts, and location conflicts.
 */
export async function checkSubprocessorAction(payload: ActionPayload, context?: any) {
  const inputs = getInputs(payload);
  const vendorName = (inputs.vendor || '').trim();
  const hostingLocation = (inputs.hostingLocation || 'United States').trim();

  if (!vendorName) {
    return {
      success: false,
      error: 'Missing required input "vendor". Please provide a vendor name to check.',
      disclaimer: 'Aviso Previo summarizes your contracts. It is not legal advice.',
    };
  }

  // 1. Check if vendor is already on the approved published vendor register
  const existingVendor = PUBLISHED_VENDORS.find(
    (v) => v.name.toLowerCase() === vendorName.toLowerCase()
  );

  const isExisting = !!existingVendor;

  // 2. Fetch customer DPAs from KVS or fallback to seed
  let dpas = CUSTOMER_DPAS;
  try {
    const storedDpaIds: string[] = (await kvs.get('dpas:list')) || [];
    if (storedDpaIds.length > 0) {
      const loaded = await Promise.all(
        storedDpaIds.map(async (id) => (await kvs.get(`dpa:${id}`)) as any)
      );
      const valid = loaded.filter(Boolean);
      if (valid.length > 0) {
        dpas = valid;
      }
    }
  } catch (err: any) {
    console.warn('Error reading DPAs from KVS in Rovo action:', err.message);
  }

  // 3. Compute deterministic earliest go-live date
  const calculation = calculateEarliestGoLive(dpas, new Date(), true);

  // 4. Check location conflicts
  const isOutsideEu = !hostingLocation.toLowerCase().includes('eu') &&
    !hostingLocation.toLowerCase().includes('germany') &&
    !hostingLocation.toLowerCase().includes('ireland') &&
    !hostingLocation.toLowerCase().includes('eea') &&
    !hostingLocation.toLowerCase().includes('europe');

  const locationConflicts = isOutsideEu
    ? dpas
        .filter((d) => d.locationRestriction === 'EU_UK_ONLY')
        .map((d) => `${d.customerName} (${d.country})`)
    : [];

  const terminationCustomers = dpas
    .filter((d) => d.remedy === 'terminate')
    .map((d) => `${d.customerName} (${d.country})`);

  return {
    success: true,
    vendor: vendorName,
    isApprovedVendor: isExisting,
    status: isExisting ? 'APPROVED_VENDOR' : 'NEW_SUBPROCESSOR',
    requiresPriorNotice: !isExisting,
    totalCustomerDpas: dpas.length,
    longestNoticeDays: calculation.longestNoticeDays,
    earliestGoLiveDate: calculation.formattedDate,
    terminationRemediesCount: terminationCustomers.length,
    customersWithTerminationRights: terminationCustomers,
    locationConflictsCount: locationConflicts.length,
    customersWithLocationConflicts: locationConflicts,
    advice: isExisting
      ? `${vendorName} is an approved subprocessor on Ayo Payroll's published register. Routine upgrades do not require customer prior notice unless personal data categories or hosting regions change.`
      : `${vendorName} is NOT on the approved subprocessor register. 41 customer DPAs require prior notice (longest: ${calculation.longestNoticeDays} days). Deployment is locked until ${calculation.formattedDate}. ${locationConflicts.length} customers have EU data residency restrictions.`,
    disclaimer: 'Aviso Previo summarizes your contracts. It is not legal advice.',
  };
}

/**
 * Action 2: explain-customer-term
 * Explains exact verbatim clause quotes and commitments for a specific customer DPA.
 */
export async function explainTermAction(payload: ActionPayload, context?: any) {
  const inputs = getInputs(payload);
  const customerQuery = (inputs.customerName || '').toLowerCase().trim();

  if (!customerQuery) {
    return {
      success: false,
      error: 'Missing required input "customerName". Please specify a customer name or DPA ID.',
      disclaimer: 'Aviso Previo summarizes your contracts. It is not legal advice.',
    };
  }

  const dpa = CUSTOMER_DPAS.find(
    (d) =>
      d.id.toLowerCase() === customerQuery ||
      d.customerName.toLowerCase().includes(customerQuery)
  );

  if (!dpa) {
    return {
      success: false,
      error: `No customer DPA found matching "${inputs.customerName}". Known customers include Nordic Logistics AS, Caledonia Finance, Bavaria HealthTech GmbH, etc.`,
      disclaimer: 'Aviso Previo summarizes your contracts. It is not legal advice.',
    };
  }

  return {
    success: true,
    dpaId: dpa.id,
    customerName: dpa.customerName,
    country: dpa.country,
    noticePeriodDays: dpa.noticePeriodDays,
    noticeUnit: dpa.noticeUnit,
    objectionWindowDays: dpa.objectionWindowDays,
    remedy: dpa.remedy,
    locationRestriction: dpa.locationRestriction,
    exactClauseQuote: dpa.exactClause,
    status: dpa.expectedStatus || 'confirmed',
    explanation: dpa.noticeUnit === 'unclear'
      ? `Customer ${dpa.customerName} has contract language specifying "${dpa.exactClause}", which lacks an explicit number of days. Aviso Previo flags this as "unclear: counsel to decide".`
      : `Customer ${dpa.customerName} requires ${dpa.noticePeriodDays} ${dpa.noticeUnit} prior notice before appointing any new subprocessor. Objection window: ${dpa.objectionWindowDays || 'unspecified'} days. Remedy: ${dpa.remedy}.${dpa.locationRestriction === 'EU_UK_ONLY' ? ' Customer mandates EU/UK data residency.' : ''}`,
    disclaimer: 'Aviso Previo summarizes your contracts. It is not legal advice.',
  };
}

/**
 * Action 3: open-privacy-notice-request
 * Opens a privacy notice request ticket and drafts customer notification text.
 */
export async function openNoticeAction(payload: ActionPayload, context?: any) {
  const inputs = getInputs(payload);
  const issueKey = (inputs.issueKey || 'ENG-142').trim().toUpperCase();
  const vendor = (inputs.vendor || 'Glimpse').trim();

  const calc = calculateEarliestGoLive(CUSTOMER_DPAS, new Date(), true);
  const legalDraft = await createOrFetchLegalRequest(issueKey, vendor, calc.formattedDate);

  return {
    success: true,
    issueKey,
    legalRequestKey: legalDraft.requestKey,
    vendor: legalDraft.vendor,
    earliestGoLiveDate: legalDraft.earliestGoLiveDate,
    affectedCustomerCount: legalDraft.affectedCustomerCount,
    longestNoticeDays: legalDraft.longestNoticeDays,
    terminationCustomers: legalDraft.terminationCustomers,
    locationConflictCustomers: legalDraft.locationConflictCustomers,
    draftNoticeEmail: {
      subject: legalDraft.draftEmailSubject,
      body: legalDraft.draftEmailBody,
    },
    message: `Privacy notice request ${legalDraft.requestKey} created/linked to ${issueKey}. Draft notice text prepared for counsel review.`,
    disclaimer: 'Aviso Previo summarizes your contracts. It is not legal advice.',
  };
}
