export type NoticeUnit = 'calendar_days' | 'business_days' | 'unclear';
export type DpaStatus = 'confirmed' | 'draft' | 'unclear';

export interface DPA {
  id: string;
  customerName: string;
  country: string;
  noticePeriodDays: number | null;
  noticeUnit: NoticeUnit;
  objectionWindowDays: number | null;
  remedy: string;
  locationRestriction: string;
  exactClause: string;
  status: DpaStatus;
}

export interface Vendor {
  key: string;
  name: string;
  category: string;
  dataProcessed?: string;
  hostingLocation?: string;
  publishedDate?: string;
}

export interface AdminState {
  dpaCount: number;
  vendorCount: number;
  confirmedCount: number;
  unclearCount: number;
  dpas: DPA[];
  vendors: Vendor[];
}

export interface Benchmark {
  totalContracts: number;
  noticePeriodAccuracy: string;
  unitAccuracy: string;
  terminationRecall: string;
  locationLimitRecall: string;
  zeroHallucinationRate: string;
  unclearHandling: string;
  overallStatus: string;
}

export interface SeedLog { stage: string; message: string }
