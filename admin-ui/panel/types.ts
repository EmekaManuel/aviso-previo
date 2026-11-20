export interface IssueAssessment {
  issueKey: string;
  classification: 'NEW_SUBPROCESSOR' | 'EXISTING_VENDOR_NO_CHANGE' | 'LOCATION_CHANGE' | 'NO_CUSTOMER_DATA' | 'UNRELATED';
  vendor?: string | null;
  purpose?: string;
  affectedCustomers?: number;
  longestNoticeDays?: number;
  terminationRightsCount?: number;
  locationConflictsCount?: number;
  conflictingCustomers?: string[];
  earliestGoLiveDate?: string;
  noticeStartedAt?: string;
  holdApplies?: boolean;
  holdActive?: boolean;
  failClosedReason?: string;
  hostingRegion?: 'EU_UK' | 'OUTSIDE_EU_UK' | 'UNKNOWN';
  basis?: { total: number; confirmed: number; pending: number; unclear: number };
  legalRequestKey?: string;
  draftNotice?: { subject: string; body: string } | null;
  aiReason?: string;
  sampleClauseCustomer?: string;
  sampleClauseQuote?: string;
  syntheticConfirmed?: boolean;
  syntheticConfirmedBy?: string;
  overridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
}
