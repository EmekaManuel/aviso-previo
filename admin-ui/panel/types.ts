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
  legalRequestKey?: string;
  draftNotice?: { subject: string; body: string } | null;
  aiReason?: string;
  sampleClauseCustomer?: string;
  sampleClauseQuote?: string;
  overridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
}
