import type { ExtractedDPATerms } from '../extraction/extractor';
import { containsClause } from '../extraction/text';

/** The hand-written label for a contract (from the sample data the clause was written with). */
export interface ContractLabel {
  id: string;
  customerName: string;
  noticePeriodDays: number | null;
  noticeUnit: 'calendar_days' | 'business_days' | 'unclear';
  remedy: string;
  locationRestriction: string;
}

export interface ContractScore {
  id: string;
  customerName: string;
  /** The model could not be used for this contract. Not counted in the accuracy figures. */
  error?: string;
  noticeOk: boolean;
  unitOk: boolean;
  terminationOk: boolean;
  locationOk: boolean;
  unclearOk: boolean;
  clauseVerbatim: boolean;
  /** Why the model said it could not decide, when it did. */
  reason?: string;
  /** Said it was certain, and was wrong about the notice period or unit. */
  confidentlyWrong: boolean;
  expected: { days: number | null; unit: string; termination: boolean; euUkOnly: boolean };
  got: { days: number | null; unit: string; termination: boolean; euUkOnly: boolean; unclear: boolean };
}

export function scoreContract(label: ContractLabel, got: ExtractedDPATerms, pageText: string): ContractScore {
  const expectedUnclear = label.noticeUnit === 'unclear';
  const gotUnclear = got.isUnclear || got.noticeUnit === 'unclear';
  const noticeOk = expectedUnclear ? gotUnclear : !gotUnclear && got.noticePeriodDays === label.noticePeriodDays;
  const unitOk = got.noticeUnit === label.noticeUnit;

  return {
    id: label.id,
    customerName: label.customerName,
    error: got.error,
    noticeOk,
    unitOk,
    terminationOk: (got.remedy === 'terminate') === (label.remedy === 'terminate'),
    locationOk: (got.locationRestriction === 'EU_UK_ONLY') === (label.locationRestriction === 'EU_UK_ONLY'),
    unclearOk: expectedUnclear === gotUnclear,
    clauseVerbatim: containsClause(pageText, got.exactClause),
    reason: gotUnclear ? got.unclearReason : undefined,
    confidentlyWrong: !gotUnclear && (!noticeOk || !unitOk),
    expected: {
      days: label.noticePeriodDays,
      unit: label.noticeUnit,
      termination: label.remedy === 'terminate',
      euUkOnly: label.locationRestriction === 'EU_UK_ONLY',
    },
    got: {
      days: got.noticePeriodDays,
      unit: got.noticeUnit,
      termination: got.remedy === 'terminate',
      euUkOnly: got.locationRestriction === 'EU_UK_ONLY',
      unclear: gotUnclear,
    },
  };
}

export interface EvaluationSummary {
  contracts: number;
  scored: number;
  errors: number;
  noticeCorrect: number;
  unitCorrect: number;
  terminationCorrect: number;
  terminationExpected: number;
  locationCorrect: number;
  locationExpected: number;
  unclearCorrect: number;
  unclearExpected: number;
  clausesVerbatim: number;
  confidentlyWrong: number;
  wrong: ContractScore[];
}

export function summarise(rows: ContractScore[], unclearLabels: Set<string> = new Set()): EvaluationSummary {
  const scored = rows.filter((r) => !r.error);
  const count = (f: (r: ContractScore) => boolean) => scored.filter(f).length;
  return {
    contracts: rows.length,
    scored: scored.length,
    errors: rows.length - scored.length,
    noticeCorrect: count((r) => r.noticeOk),
    unitCorrect: count((r) => r.unitOk),
    terminationCorrect: count((r) => r.expected.termination && r.got.termination),
    terminationExpected: count((r) => r.expected.termination),
    locationCorrect: count((r) => r.expected.euUkOnly && r.got.euUkOnly),
    locationExpected: count((r) => r.expected.euUkOnly),
    unclearCorrect: count((r) => r.expected.unit === 'unclear' && r.got.unclear),
    unclearExpected: count((r) => r.expected.unit === 'unclear'),
    clausesVerbatim: count((r) => r.clauseVerbatim),
    confidentlyWrong: count((r) => r.confidentlyWrong),
    wrong: scored.filter((r) => !r.noticeOk || !r.unitOk || !r.terminationOk || !r.locationOk || !r.unclearOk),
  };
}
