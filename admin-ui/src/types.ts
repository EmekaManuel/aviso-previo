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
  confluencePageId?: string | null;
  resolvedByCounsel?: boolean;
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

export interface SeedLog { stage: string; status: string; message: string }

export interface ExtractionCheck {
  extracted: {
    noticePeriodDays: number | null;
    noticeUnit: NoticeUnit;
    objectionWindowDays: number | null;
    remedy: string;
    locationRestriction: string;
    exactClause: string;
    clauseVerified: boolean;
    unclear: boolean;
  };
  matches: { notice: boolean; unit: boolean; remedy: boolean; location: boolean };
}

/** One contract's score from the evaluation run. Error rows carry only `error`. */
export interface ScoreRow {
  id: string;
  customerName: string;
  error?: string;
  noticeOk?: boolean;
  unitOk?: boolean;
  terminationOk?: boolean;
  locationOk?: boolean;
  unclearOk?: boolean;
  clauseVerbatim?: boolean;
  confidentlyWrong?: boolean;
  expected?: { days: number | null; unit: string; termination: boolean; euUkOnly: boolean };
  got?: { days: number | null; unit: string; termination: boolean; euUkOnly: boolean; unclear: boolean };
}

export interface EvalBatch { rows: ScoreRow[]; total: number; nextOffset: number; done: boolean }

export interface GraphStatus {
  connected: boolean;
  lastSync: { at: string; ok: boolean; synced: number; rejected: number; linkedTickets: number; message?: string } | null;
}
