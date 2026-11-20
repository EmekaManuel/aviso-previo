import { evaluateHold, parseHostingRegion } from '../engine/holdPolicy';
import { createOrFetchLegalRequest } from '../legal/legalRequest';
import { loadRegister } from '../storage/register';
import { loadRegisterShared, loadVendorsShared } from '../storage/mirror';
import type { HostingRegion } from '../types';
import type { TicketClassification } from '../classification/ticketClassifier';

export interface ActionPayload {
  inputs?: Record<string, any>;
  [key: string]: any;
}

const DISCLAIMER = 'Aviso Previo summarizes your contracts. It is not legal advice.';
const fail = (error: string) => ({ success: false, error, disclaimer: DISCLAIMER });

/** Inputs may arrive as `payload.inputs` or directly on the payload. */
function getInputs(payload: ActionPayload): Record<string, any> {
  return payload?.inputs || payload || {};
}

/**
 * Action 1: check-subprocessor-commitments
 * "What would adding this vendor commit us to?" Reads the same register the app
 * uses; only counsel-confirmed terms count. The date is a what-if from today.
 */
export async function checkSubprocessorAction(payload: ActionPayload, _context?: any) {
  const inputs = getInputs(payload);
  const vendorName = String(inputs.vendor || '').trim();
  const hostingText = String(inputs.hostingLocation || '').trim();
  if (!vendorName) return fail('Missing required input "vendor". Please provide a vendor name to check.');

  const [terms, vendors] = await Promise.all([loadRegisterShared(), loadVendorsShared()]);
  if (terms.length === 0) return fail('No customer contracts are loaded yet. Load the sample or the register under Aviso Previo Admin in Jira, then ask again.');

  const approved = vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase());
  const region: HostingRegion = parseHostingRegion(hostingText);

  let classification: TicketClassification = 'NEW_SUBPROCESSOR';
  if (approved) {
    const wasInEu = parseHostingRegion(approved.hostingLocation) === 'EU_UK';
    classification = region === 'OUTSIDE_EU_UK' && wasInEu ? 'LOCATION_CHANGE' : 'EXISTING_VENDOR_NO_CHANGE';
  }

  const now = new Date();
  const hold = evaluateHold({ classification, hostingRegion: region, terms, noticeStartedAt: now, now });
  const needsNotice = hold.applies;

  const advice = !needsNotice
    ? `${approved?.name ?? vendorName} is an approved subprocessor and no hosting change was given, so no customer notice is triggered.`
    : hold.failClosedReason
      ? hold.failClosedReason
      : classification === 'NEW_SUBPROCESSOR'
        ? `${vendorName} is not on the approved subprocessor list. ${hold.affectedCustomers} confirmed customer DPA(s) require prior notice (longest: ${hold.longestNoticeDays} days), so it could not go live before ${hold.earliestGoLiveDate}.`
        : `Moving ${approved?.name} outside the EU/UK is forbidden by ${hold.locationConflictsCount || hold.affectedCustomers} confirmed customer DPA(s).`;

  return {
    success: true,
    vendor: vendorName,
    isApprovedVendor: Boolean(approved),
    status: classification,
    requiresPriorNotice: needsNotice,
    totalCustomerDpas: hold.basis.total,
    confirmedCustomerDpas: hold.basis.confirmed,
    awaitingCounsel: hold.basis.pending + hold.basis.unclear,
    affectedCustomerCount: hold.affectedCustomers,
    longestNoticeDays: hold.longestNoticeDays,
    earliestGoLiveDate: needsNotice && !hold.failClosedReason ? hold.earliestGoLiveDate : null,
    terminationCustomers: hold.terminationCustomers,
    locationConflictsCount: hold.locationConflictsCount,
    customersWithLocationConflicts: hold.conflictingCustomers,
    hostingRegionAssumed: region === 'UNKNOWN' ? 'Not given: treated as outside the EU/UK' : region,
    advice,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Action 2: explain-customer-term
 * The verbatim clause and extracted terms for one customer's DPA.
 */
export async function explainTermAction(payload: ActionPayload, _context?: any) {
  const query = String(getInputs(payload).customerName || '').toLowerCase().trim();
  if (!query) return fail('Missing required input "customerName". Please specify a customer name or DPA ID.');

  const terms = await loadRegisterShared();
  if (terms.length === 0) return fail('No customer contracts are loaded yet. Load the sample or the register under Aviso Previo Admin in Jira, then ask again.');

  const dpa = terms.find((d) => d.id.toLowerCase() === query || d.customerName.toLowerCase().includes(query));
  if (!dpa) return fail(`No customer DPA found matching "${getInputs(payload).customerName}".`);

  const unclear = dpa.noticeUnit === 'unclear' || dpa.noticePeriodDays === null;
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
    status: dpa.status,
    explanation: unclear
      ? `The clause for ${dpa.customerName} gives no number of days ("${dpa.exactClause}"). Aviso Previo marks it "unclear: counsel to decide" and does not guess.`
      : `${dpa.customerName} requires ${dpa.noticePeriodDays} ${dpa.noticeUnit.replace('_', ' ')} of prior notice before a new subprocessor. Objection window: ${dpa.objectionWindowDays ?? 'unspecified'} days. Remedy: ${dpa.remedy}.${dpa.locationRestriction === 'EU_UK_ONLY' ? ' Processing must stay in the EU/UK.' : ''}${dpa.status === 'confirmed' ? '' : ' These terms are not yet confirmed by counsel.'}`,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Action 3: open-privacy-notice-request
 * Opens (or returns) the privacy request for a Jira issue, with a draft customer notice.
 */
export async function openNoticeAction(payload: ActionPayload, _context?: any) {
  const inputs = getInputs(payload);
  const issueKey = String(inputs.issueKey || '').trim().toUpperCase();
  if (!issueKey) return fail('Missing required input "issueKey". Please give the Jira issue that introduces the change.');

  // Ticket decisions and notice clocks live in the Jira install. From another product's install there
  // is nothing to continue, and starting a second clock for the same ticket would be wrong.
  if ((await loadRegister()).length === 0) {
    return fail('Opening a privacy request needs this site\'s ticket records, which are kept in Jira. Ask this agent from Jira (the Ask Rovo button in Jira) to open the request.');
  }
  try {
    const draft = await createOrFetchLegalRequest(issueKey);
    return {
      success: true,
      issueKey,
      legalRequestKey: draft.requestKey,
      vendor: draft.vendor,
      earliestGoLiveDate: draft.earliestGoLiveDate,
      affectedCustomerCount: draft.affectedCustomerCount,
      longestNoticeDays: draft.longestNoticeDays,
      terminationCustomers: draft.terminationCustomers,
      locationConflictCustomers: draft.locationConflictCustomers,
      draftNoticeEmail: { subject: draft.draftEmailSubject, body: draft.draftEmailBody },
      message: `Privacy notice request ${draft.requestKey} is linked to ${issueKey}. The draft notice is ready for counsel review.`,
      disclaimer: DISCLAIMER,
    };
  } catch (err: any) {
    return fail(err?.message || 'Could not open the privacy request.');
  }
}
