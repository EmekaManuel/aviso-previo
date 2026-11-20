import React from 'react';
import type { Benchmark } from './types';

const pct = (s: string) => Math.min(100, parseFloat(s) || 0);

export function Evaluation({ score, running, onRun, total }: { score: Benchmark | null; running: boolean; onRun: () => void; total: number }) {
  const rows: [string, string][] = score
    ? [
        ['Notice period', score.noticePeriodAccuracy],
        ['Calendar vs. business days', score.unitAccuracy],
        ['Termination rights found', score.terminationRecall],
        ['Location limits found', score.locationLimitRecall],
        ['Claims backed by a clause', score.zeroHallucinationRate],
        ['Ambiguous clauses flagged', score.unclearHandling],
      ]
    : [];
  return (
    <div className="stack">
      <section className="card card-pad">
        <div className="row spread">
          <div>
            <h2 className="h2">Extraction accuracy</h2>
            <p className="lead" style={{ marginTop: 6 }}>Extracted terms for all {total || 41} contracts, checked against a hand-labelled answer key. A wrong but confident answer counts as a failure.</p>
          </div>
          <button className="btn btn-primary" onClick={onRun} disabled={running}>{running ? 'Running…' : score ? 'Run again' : 'Run evaluation'}</button>
        </div>
      </section>
      {score && (
        <section className="card card-pad">
          <div className="row spread" style={{ marginBottom: 6 }}>
            <span className="kicker">{score.totalContracts} contracts</span>
            <span className={`pill ${score.overallStatus === 'PASS' ? 'ok' : 'risk'}`}>{score.overallStatus === 'PASS' ? 'Passed' : 'Failed'}</span>
          </div>
          {rows.map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <div className="progress"><span style={{ width: `${pct(value)}%` }} /></div>
              <b className="num">{value.split(' ')[0]}</b>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
