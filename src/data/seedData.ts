export interface DPATermSeed {
  id: string;
  customerName: string;
  country: string;
  noticePeriodDays: number | null;
  noticeUnit: 'calendar_days' | 'business_days' | 'unclear';
  objectionWindowDays: number | null;
  remedy: 'terminate' | 'good_faith_negotiation' | 'reasonable_efforts' | 'unspecified';
  noticeMethod: 'email' | 'written_notice' | 'portal' | 'unspecified';
  locationRestriction: 'EU_UK_ONLY' | 'NONE';
  exactClause: string;
  isBuriedInDataTransfer: boolean;
  expectedStatus: 'confirmed' | 'unclear';
}

export interface VendorSeed {
  key: string;
  name: string;
  category: string;
  dataProcessed: string;
  hostingLocation: string;
  publishedDate: string;
}

export interface TicketSeed {
  key: string;
  summary: string;
  description: string;
  expectedClassification: 'NEW_SUBPROCESSOR' | 'EXISTING_VENDOR_NO_CHANGE' | 'LOCATION_CHANGE' | 'NO_CUSTOMER_DATA' | 'UNRELATED';
  expectedAffectedCount?: number;
  expectedLongestNotice?: number;
}

// 9 Published Vendors on Ayo Payroll Subprocessor Page
export const PUBLISHED_VENDORS: VendorSeed[] = [
  {
    key: 'cloudharbor',
    name: 'CloudHarbor',
    category: 'Cloud Infrastructure & Compute',
    dataProcessed: 'Encrypted database records, app container runtime',
    hostingLocation: 'Frankfurt, Germany (EU)',
    publishedDate: '2025-01-15',
  },
  {
    key: 'relaypost',
    name: 'RelayPost',
    category: 'Transactional Email Delivery',
    dataProcessed: 'Employee notification emails, payslip notification delivery',
    hostingLocation: 'Dublin, Ireland (EU)',
    publishedDate: '2025-01-15',
  },
  {
    key: 'errorsentry',
    name: 'ErrorSentry',
    category: 'Error Monitoring & Crash Diagnostics',
    dataProcessed: 'Stack traces, client-side error telemetry (PII masked)',
    hostingLocation: 'Frankfurt, Germany (EU)',
    publishedDate: '2025-02-01',
  },
  {
    key: 'helpdeskconnect',
    name: 'HelpDeskConnect',
    category: 'Customer Support Ticketing',
    dataProcessed: 'Support request threads, customer contact emails',
    hostingLocation: 'Northern Virginia (US)',
    publishedDate: '2025-02-10',
  },
  {
    key: 'payroute',
    name: 'PayRoute',
    category: 'Payment Gateway Interface',
    dataProcessed: 'Bank routing identifiers, direct deposit instructions',
    hostingLocation: 'London (UK) & Lagos (Nigeria)',
    publishedDate: '2025-01-15',
  },
  {
    key: 'vaultmetrics',
    name: 'VaultMetrics',
    category: 'Infrastructure Logs & APM',
    dataProcessed: 'Application logs, request timing headers',
    hostingLocation: 'Frankfurt, Germany (EU)',
    publishedDate: '2025-03-01',
  },
  {
    key: 'docsigner',
    name: 'DocSigner',
    category: 'Electronic Signature Processing',
    dataProcessed: 'Employment contract PDFs, digital signatures',
    hostingLocation: 'Dublin, Ireland (EU)',
    publishedDate: '2025-04-12',
  },
  {
    key: 'cachestream',
    name: 'CacheStream',
    category: 'CDN & Edge Static Assets',
    dataProcessed: 'Static web bundles, stylesheets, icons (no personal data)',
    hostingLocation: 'Global Edge Locations',
    publishedDate: '2025-01-15',
  },
  {
    key: 'identitypass',
    name: 'IdentityPass',
    category: 'Multi-Factor Authentication (MFA)',
    dataProcessed: 'SMS verification tokens, authenticator app validation',
    hostingLocation: 'Frankfurt, Germany (EU)',
    publishedDate: '2025-05-20',
  },
];

// 41 Customer DPAs for Ayo Payroll
export const CUSTOMER_DPAS: DPATermSeed[] = [
  // 1 to 5: Standard 30 days
  {
    id: 'CUST-001',
    customerName: 'Kano Textiles Ltd',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Supplier shall provide Customer with at least thirty (30) calendar days prior written notice via email before engaging any new Subprocessor. Customer may object in writing within fourteen (14) days of receipt.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-002',
    customerName: 'Meridian Logistics PLC',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Ayo Payroll shall inform Customer of any intended appointment of a Subprocessor thirty (30) days in advance by notice to legal@meridianlogistics.ng, granting thirty (30) days to raise reasonable data protection objections.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-003',
    customerName: 'St. Jude Health Network',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 21,
    remedy: 'reasonable_efforts',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'Prior to engaging any sub-tier processor with access to personal data, the Processor must give thirty (30) calendar days prior written notice. If the Controller objects within 21 days, the parties shall make reasonable efforts to find a mutually acceptable alternative.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-004',
    customerName: 'Thames Valley Energy Corp',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'portal',
    locationRestriction: 'NONE',
    exactClause:
      'Notification of new Subprocessors shall occur through posting on the vendor trust portal at least 30 days before authorization. The Controller retains a 15-day objection period.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-005',
    customerName: 'Atlas Marine Services BV',
    country: 'Netherlands',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 20,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'The Data Processor shall notify Customer at least 30 days prior to onboarding any new subprocessor. Customer may submit objections on reasonable grounds relating to the protection of personal data within 20 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 6: Special - 60 days, Termination right, EU/UK only restriction
  {
    id: 'CUST-006',
    customerName: 'Nordic Logistics AS',
    country: 'Norway',
    noticePeriodDays: 60,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'terminate',
    noticeMethod: 'written_notice',
    locationRestriction: 'EU_UK_ONLY',
    exactClause:
      'Supplier shall give Customer at least 60 calendar days prior written notice of the appointment of any new Subprocessor. Customer may object within 30 days; if the parties cannot reach an agreed resolution within thirty days of objection, Customer may terminate the affected services without penalty. Personal data shall remain exclusively within the European Economic Area (EEA) and the UK; transfer to or processing in third countries including the United States is strictly prohibited without prior written consent.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 7 to 11: 30 days
  {
    id: 'CUST-007',
    customerName: 'Eko Financial Advisory',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Ayo Payroll will give thirty (30) days prior electronic notice of new subprocessors. Objections must be communicated within 14 calendar days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-008',
    customerName: 'Bristol Aerotech Ltd',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'reasonable_efforts',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'The Contractor agrees to provide 30 days prior written notice before sub-contracting any data processing operations. Company has 30 days to review security credentials.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-009',
    customerName: 'Iberian Hospitality SL',
    country: 'Spain',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Processor shall notify Controller at least thirty (30) days prior to authorizing any new subprocessor. Controller may object within fifteen (15) days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-010',
    customerName: 'Lagos Breweries Group',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Customer shall receive thirty (30) days written notice of any modification to the approved subprocessor list, with 14 days to raise objections.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-011',
    customerName: 'Cambridge Genomics UK',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 20,
    remedy: 'reasonable_efforts',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'At least thirty (30) days advance notice is required before any third party is granted access to payroll records. Controller may object within twenty (20) days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 12: Special - 60 days, Termination right
  {
    id: 'CUST-012',
    customerName: 'Caledonia Finance Ltd',
    country: 'United Kingdom',
    noticePeriodDays: 60,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'terminate',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'The Processor shall notify the Customer in writing at least sixty (60) days in advance of any planned change concerning the addition or replacement of other processors. If the Customer objects on reasonable data security grounds within 30 days and the Processor does not withdraw the appointment, Customer may terminate this Agreement immediately without penalty.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 13 to 18: 30 days
  {
    id: 'CUST-013',
    customerName: 'Vandermeer Media BV',
    country: 'Netherlands',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'portal',
    locationRestriction: 'NONE',
    exactClause:
      'Ayo Payroll maintains an online list of subprocessors and will provide 30 days advance notice of any additions. Objections must be registered within 15 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-014',
    customerName: 'Abuja Real Estate Holdings',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Thirty (30) days prior written notice shall be provided to Client before any new processing vendor is engaged. Objections accepted within 14 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-015',
    customerName: 'Edinburgh Data Systems',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 21,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Notice of thirty (30) calendar days is required for new sub-processors. Controller reserves the right to object within twenty-one (21) days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-016',
    customerName: 'Rhine Valley Biotech AG',
    country: 'Germany',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'reasonable_efforts',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'The Auftragsverarbeiter shall notify the Auftraggeber at least 30 days before engaging a sub-contractor. The Auftraggeber has 14 days to raise legitimate objections.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-017',
    customerName: 'Port Harcourt Energy Partners',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Subprocessor additions require 30 days advance email notice to compliance@phep.ng, with a 15-day window for review.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-018',
    customerName: 'Manchester Supply Chain Ltd',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Supplier must provide thirty (30) days prior notification of any prospective new sub-processor, with 30 days allowed for Customer objection.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 19: Special - 60 days, EU-only location restriction
  {
    id: 'CUST-019',
    customerName: 'Bavaria HealthTech GmbH',
    country: 'Germany',
    noticePeriodDays: 60,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'written_notice',
    locationRestriction: 'EU_UK_ONLY',
    exactClause:
      'The Contractor shall provide at least sixty (60) days advance notice in writing of any planned change to subprocessors. The Client may object within 30 days. All processing of Personal Data must take place within the European Union. Transfer to third countries without adequacy decision or prior authorization is not permitted.',
    isBuriedInDataTransfer: true,
    expectedStatus: 'confirmed',
  },

  // 20 to 25: 30 days
  {
    id: 'CUST-020',
    customerName: 'West African Mining Corp',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Ayo Payroll will notify the Customer thirty (30) days before a subprocessor begins processing personal data, allowing 14 days for feedback.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-021',
    customerName: 'Oxford Academic Publishing',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 20,
    remedy: 'reasonable_efforts',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'The Data Processor shall inform the Publisher at least 30 days in advance of any changes regarding subprocessors. Publisher may object within 20 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-022',
    customerName: 'Dublin Cloud Solutions Ltd',
    country: 'Ireland',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'portal',
    locationRestriction: 'NONE',
    exactClause:
      'Thirty (30) days notice via online status bulletin will precede any subprocessor deployment, with a fourteen (14) day objection period.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-023',
    customerName: 'Calabar Shipping Lines',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Notice of at least 30 days is mandatory prior to onboarding any new subcontractor handling payroll records. Objections permitted within 15 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-024',
    customerName: 'Leeds Financial Analytics',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 21,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Customer must receive 30 calendar days notice prior to new sub-processing agreements taking effect. Objection period is 21 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-025',
    customerName: 'Flemish Logistics NV',
    country: 'Belgium',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'Supplier undertakes to give 30 days prior written notice before subprocessor access is granted. Client may object within fifteen (15) days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 26: 60 days notice
  {
    id: 'CUST-026',
    customerName: 'Highland Distillers Group',
    country: 'United Kingdom',
    noticePeriodDays: 60,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'Processor shall notify Controller with not less than sixty (60) calendar days written notice before appointing any new sub-processor. Controller may object within 30 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 27: Special - 60 days, EU-only location restriction
  {
    id: 'CUST-027',
    customerName: 'Stockholm Retail Group AB',
    country: 'Sweden',
    noticePeriodDays: 60,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'EU_UK_ONLY',
    exactClause:
      'The Supplier must give at least 60 days prior notice by email before onboarding any subprocessor. Customer retains a 30-day objection right. Data storage and processing shall be confined to EEA member states.',
    isBuriedInDataTransfer: true,
    expectedStatus: 'confirmed',
  },

  // 28: 60 days notice
  {
    id: 'CUST-028',
    customerName: 'Ibadan Agro Allied Ltd',
    country: 'Nigeria',
    noticePeriodDays: 60,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'Customer requires sixty (60) days prior formal notice of any subprocessor appointment. Objections may be filed within thirty (30) days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 29 to 38: 30 days
  {
    id: 'CUST-029',
    customerName: 'Newcastle Marine Engineering',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Notice of 30 days will be given prior to new subprocessor commencement. Objections within 14 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-030',
    customerName: 'Parisian Creative Studio SAS',
    country: 'France',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'The Data Processor shall notify Customer thirty (30) days in advance of engaging any subprocessor. The Customer may object within 15 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-031',
    customerName: 'Warri Petroleum Services',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Thirty (30) calendar days prior written notice is required before any subprocessor integration. 14 days objection window.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-032',
    customerName: 'Sheffield Steel Works',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 20,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'The Supplier agrees to give thirty (30) days notice prior to adding any sub-tier processor. Customer objection period is 20 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-033',
    customerName: 'Rotterdam Terminal Operations',
    country: 'Netherlands',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'portal',
    locationRestriction: 'NONE',
    exactClause:
      'Subprocessor notifications will be posted with 30 days advance notice. Customer may object within 15 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-034',
    customerName: 'Enugu Telecommunications Ltd',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Ayo Payroll shall provide 30 days prior written notice to Enugu Telecom before engaging any new subprocessor. Objections must be made in 14 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-035',
    customerName: 'Cardiff Legal Consultancy',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 21,
    remedy: 'reasonable_efforts',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'Thirty (30) calendar days advance written notice must be served prior to engaging any subprocessor. Client has 21 days to raise objections.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-036',
    customerName: 'Munich Automotive Systems',
    country: 'Germany',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 14,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'The Processor must provide 30 days prior written notice before sub-processing personal data. The Controller retains a 14-day objection window.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-037',
    customerName: 'Benin Power & Energy',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Notice of 30 days is required prior to introducing new vendors touching customer information. Objections permitted within 15 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-038',
    customerName: 'Belfast Digital Commerce',
    country: 'United Kingdom',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 30,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'Supplier must provide thirty (30) days prior notification of new sub-processors, with thirty (30) days for Customer review.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },
  {
    id: 'CUST-039',
    customerName: 'Milan Fashion Logistics SRL',
    country: 'Italy',
    noticePeriodDays: 30,
    noticeUnit: 'calendar_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'email',
    locationRestriction: 'NONE',
    exactClause:
      'The Supplier will give 30 days notice before deploying any new subprocessor. Customer may submit reasonable objections within 15 days.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 40: Special - 30 Business Days
  {
    id: 'CUST-040',
    customerName: 'Sokoto Cement Industries',
    country: 'Nigeria',
    noticePeriodDays: 30,
    noticeUnit: 'business_days',
    objectionWindowDays: 15,
    remedy: 'good_faith_negotiation',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'Ayo Payroll shall deliver formal written notification at least thirty (30) business days prior to permitting any new subprocessor to access company payroll records. The Company retains fifteen (15) business days to object.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'confirmed',
  },

  // 41: Special - Unclear ("reasonable period", never guessed)
  {
    id: 'CUST-041',
    customerName: 'Apex Health Services PLC',
    country: 'Nigeria',
    noticePeriodDays: null,
    noticeUnit: 'unclear',
    objectionWindowDays: null,
    remedy: 'unspecified',
    noticeMethod: 'written_notice',
    locationRestriction: 'NONE',
    exactClause:
      'Supplier shall provide Customer with notice within a reasonable period prior to engaging any subprocessor. Customer may object promptly upon receipt of such notice.',
    isBuriedInDataTransfer: false,
    expectedStatus: 'unclear',
  },
];

// Planted and ordinary test tickets for company-managed ENG project
export const SAMPLE_TICKETS: TicketSeed[] = [
  // 4 Planted Tickets
  {
    key: 'ENG-142',
    summary: 'Add session replay to the payslip screen using Glimpse (fictional vendor) to debug layout bugs',
    description:
      'To help triage CSS rendering issues reported by mobile employees viewing payslips, we will integrate Glimpse session replay SDK onto the payslip and tax calculation screens. Glimpse records DOM events and user session state for playback and hosts data on their US multi-tenant cluster.',
    expectedClassification: 'NEW_SUBPROCESSOR',
    expectedAffectedCount: 41,
    expectedLongestNotice: 60,
  },
  {
    key: 'ENG-151',
    summary: 'Upgrade ErrorSentry SDK to v8',
    description:
      'Update the client-side error telemetry library @errorsentry/browser from v7.11 to v8.2.0. This brings OpenTelemetry tracing support. No changes to data collection scope or hosting region (remains Frankfurt EU cluster).',
    expectedClassification: 'EXISTING_VENDOR_NO_CHANGE',
  },
  {
    key: 'ENG-156',
    summary: 'Move RelayPost sending region from EU to US',
    description:
      'To take advantage of RelayPost dedicated IP warm-up pools in the US-East data center, reconfigure our mail delivery pipeline to route payslip notifications through RelayPost US infrastructure instead of the Dublin EU endpoint.',
    expectedClassification: 'LOCATION_CHANGE',
    expectedAffectedCount: 3,
  },
  {
    key: 'ENG-160',
    summary: 'Evaluate Glimpse in sandbox with synthetic data only',
    description:
      'Spin up a temporary staging container to test Glimpse session replay performance. Testing will be performed exclusively using mock test fixtures and synthetic employee numbers; no production or customer personal data will be loaded.',
    expectedClassification: 'NO_CUSTOMER_DATA',
  },

  // Additional ordinary tickets to populate a realistic 20-ticket backlog
  {
    key: 'ENG-135',
    summary: 'Fix tax rounding error on pension deductions for UK employees',
    description: 'Ensure statutory pension calculations round to 2 decimal places using banker rounding.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-136',
    summary: 'Add CSV export for monthly payroll summary reports',
    description: 'Finance admins need to export aggregate payroll summaries to CSV.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-137',
    summary: 'Optimize database indexing on employee_salary_records table',
    description: 'Add composite index on (company_id, pay_period_start) to speed up payslip generation.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-138',
    summary: 'Improve MFA prompt accessibility on login form',
    description: 'Ensure screen readers correctly announce the 6-digit TOTP input field.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-139',
    summary: 'Update PDF payslip template with corporate logo watermark',
    description: 'Display customer company logo in header of generated payslip PDFs.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-140',
    summary: 'Upgrade Redis cache instance to version 7.2',
    description: 'Perform routine maintenance upgrade on internal Redis session store.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-141',
    summary: 'Add automated retry logic for direct deposit webhooks',
    description: 'Implement exponential backoff when receiving 502 from bank gateway.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-143',
    summary: 'Refactor salary packaging module for electric vehicle salary sacrifice',
    description: 'Support pre-tax deduction line items for company EV leasing schemes.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-144',
    summary: 'Fix dark mode contrast on payroll settings dropdown',
    description: 'Color contrast ratio on disabled items was below WCAG AA requirements.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-145',
    summary: 'Add support for Nigerian National Identity Number (NIN) validation',
    description: 'Validate 11-digit NIN format on employee onboarding forms.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-146',
    summary: 'Improve health check endpoint response times in CloudHarbor',
    description: 'Decouple deep database checks from liveness probe to avoid false restart loops.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-147',
    summary: 'Audit dependency tree for vulnerable transitive npm packages',
    description: 'Run npm audit and update lockfile to remediate identified security notices.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-148',
    summary: 'Support HMRC Real Time Information (RTI) FPS submission format v2026',
    description: 'Update annual XML submission schema for UK PAYE end-of-year reporting.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-149',
    summary: 'Cache bank verification codes locally to reduce PayRoute API calls',
    description: 'Store sort-code lookup data in local redis with 24hr TTL.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-150',
    summary: 'Fix broken documentation link in employee portal welcome email',
    description: 'Update FAQ link to point to current Confluence support portal.',
    expectedClassification: 'UNRELATED',
  },
  {
    key: 'ENG-152',
    summary: 'Automate weekly database backup verification in Frankfurt region',
    description: 'Cron job to spin up temporary test instance and restore latest snapshot.',
    expectedClassification: 'UNRELATED',
  },
];
