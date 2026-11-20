import type { ScoreRow } from './types';

export interface EvalSummary {
  contracts: number;
  scored: number;
  errors: number;
  notice: number;
  unit: number;
  termination: [number, number];
  location: [number, number];
  unclear: [number, number];
  verbatim: number;
  confidentlyWrong: number;
  wrong: ScoreRow[];
}

/** Adds up the per-contract rows. Contracts the model could not read are counted as errors, not as wrong. */
export function summarise(rows: ScoreRow[]): EvalSummary {
  const ok = rows.filter((r) => !r.error);
  const n = (f: (r: ScoreRow) => boolean) => ok.filter(f).length;
  return {
    contracts: rows.length,
    scored: ok.length,
    errors: rows.length - ok.length,
    notice: n((r) => !!r.noticeOk),
    unit: n((r) => !!r.unitOk),
    termination: [n((r) => !!r.expected?.termination && !!r.got?.termination), n((r) => !!r.expected?.termination)],
    location: [n((r) => !!r.expected?.euUkOnly && !!r.got?.euUkOnly), n((r) => !!r.expected?.euUkOnly)],
    unclear: [n((r) => r.expected?.unit === 'unclear' && !!r.got?.unclear), n((r) => r.expected?.unit === 'unclear')],
    verbatim: n((r) => !!r.clauseVerbatim),
    confidentlyWrong: n((r) => !!r.confidentlyWrong),
    wrong: ok.filter((r) => !r.noticeOk || !r.unitOk || !r.terminationOk || !r.locationOk || !r.unclearOk),
  };
}
