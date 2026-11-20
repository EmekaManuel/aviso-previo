import React from 'react';
import type { ScoreRow } from './types';
import { summarise } from './summarise';

interface Props {
  rows: ScoreRow[];
  total: number;
  running: boolean;
  finished: boolean;
  onRun: () => void;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function Evaluation({ rows, total, running, finished, onRun }: Props) {
  const s = summarise(rows);
  const lines: [string, number, number][] = [
    ['Notice period', s.notice, s.scored],
    ['Calendar vs. business days', s.unit, s.scored],
    ['Termination rights found', s.termination[0], s.termination[1]],
    ['EU/UK-only limits found', s.location[0], s.location[1]],
    ['Ambiguous clauses flagged', s.unclear[0], s.unclear[1]],
    ['Clause quoted word for word', s.verbatim, s.scored],
  ];

  return (
    <div className="stack">
      <section className="card card-pad">
        <div className="row spread">
          <div>
            <h2 className="h2">Extraction accuracy</h2>
            <p className="lead" style={{ marginTop: 6 }}>
              Claude reads each contract from its Confluence page and every answer is checked against the label the sample contract was written with. It makes one Forge LLM call per contract ({total || 41} in all). A confident wrong answer counts as a failure; an ambiguous clause is only correct if flagged.
            </p>
          </div>
          <button className="btn btn-primary" onClick={onRun} disabled={running || total === 0}>
            {running ? `Reading ${rows.length}/${total}…` : finished ? 'Run again' : 'Run evaluation'}
          </button>
        </div>
        {running && <div className="progress" style={{ marginTop: 20 }}><span style={{ width: `${pct(rows.length, total)}%` }} /></div>}
      </section>

      {rows.length > 0 && (
        <section className="card card-pad">
          <div className="row spread" style={{ marginBottom: 6 }}>
            <span className="kicker">{s.scored} of {total || s.contracts} contracts read{finished ? '' : ' so far'}</span>
            {finished && s.errors === 0 && (
              <span className={`pill ${s.confidentlyWrong === 0 && s.wrong.length === 0 ? 'ok' : 'warn'}`}>
                {s.confidentlyWrong === 0 && s.wrong.length === 0 ? 'No disagreements' : `${s.wrong.length} disagreement${s.wrong.length === 1 ? '' : 's'}`}
              </span>
            )}
          </div>
          <div className="row" style={{ gap: 28, padding: '14px 0 6px', borderTop: '1px solid var(--line)' }}>
            <span><b className="num">{s.wrongAnswers}</b> <span className="muted">wrong answers</span></span>
            <span><b className="num">{s.declined}</b> <span className="muted">declined to guess</span></span>
            <span><b className="num">{s.scored - s.wrong.length}</b> <span className="muted">matched the label exactly</span></span>
          </div>
          {lines.map(([label, a, b]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <div className="progress"><span style={{ width: `${pct(a, b)}%` }} /></div>
              <b className="num">{a}/{b}</b>
            </div>
          ))}
          <div className="metric">
            <span>Confidently wrong</span>
            <div />
            <b className="num">{s.confidentlyWrong}</b>
          </div>
          {s.errors > 0 && (
            <div className="note warn" style={{ marginTop: 14 }}>
              <b>{s.errors} contract{s.errors === 1 ? '' : 's'} could not be read</b> (the model call failed or the page is missing). They are not counted above. First error: {rows.find((r) => r.error)?.error}
            </div>
          )}
        </section>
      )}

      {s.wrong.length > 0 && (
        <section className="card card-pad">
          <h2 className="h2">Disagreements</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>Where Claude's reading differs from the label. When it declines to decide, its reason is shown. Review the clause before deciding which is right.</p>
          <ul className="attn">
            {s.wrong.map((r) => (
              <li key={r.id}>
                <div style={{ padding: '12px 0' }}>
                  <span className="who">{r.customerName}</span>
                  <span className="muted"> · expected {r.expected?.days ?? 'unclear'} {r.expected?.unit.replace('_', ' ')}, read {r.got?.unclear ? 'unclear' : `${r.got?.days} ${r.got?.unit.replace('_', ' ')}`}</span>
                  {r.reason && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Model's reason: {r.reason}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
