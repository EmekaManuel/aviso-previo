import React, { useMemo } from 'react';
import type { AdminState, DPA, GraphStatus } from './types';
import { StatusPill, isUnclear, noticeText } from './ui';

interface Props {
  data: AdminState;
  busy: boolean;
  onSeed: () => void;
  onConfirmAll: () => void;
  onOpen: (d: DPA) => void;
  onGoRegister: () => void;
  graph: GraphStatus | null;
  onSyncGraph: () => void;
}

export function Overview({ data, busy, onSeed, onConfirmAll, onOpen, onGoRegister, graph, onSyncGraph }: Props) {
  const { dpas, dpaCount, confirmedCount, unclearCount, vendorCount } = data;
  const reviewable = dpaCount - unclearCount;
  const pending = Math.max(reviewable - confirmedCount, 0);
  const pct = reviewable ? Math.round((confirmedCount / reviewable) * 100) : 0;

  const profile = useMemo(() => {
    const count = (f: (d: DPA) => boolean) => dpas.filter(f).length;
    const n30 = count((d) => d.noticePeriodDays === 30);
    const n60 = count((d) => d.noticePeriodDays === 60);
    const other = count((d) => !!d.noticePeriodDays && d.noticePeriodDays !== 30 && d.noticePeriodDays !== 60);
    return {
      rows: [
        { label: '30-day notice', n: n30, cls: '' },
        { label: '60-day notice', n: n60, cls: 'a' },
        { label: 'Other notice', n: other, cls: '' },
        { label: 'Termination right', n: count((d) => d.remedy === 'terminate'), cls: 'r' },
        { label: 'EU/UK data only', n: count((d) => d.locationRestriction === 'EU_UK_ONLY'), cls: 't' },
        { label: 'Business days', n: count((d) => d.noticeUnit === 'business_days'), cls: '' },
      ],
    };
  }, [dpas]);
  const max = Math.max(1, ...profile.rows.map((r) => r.n));

  const attention = useMemo(() => {
    const score = (d: DPA) => (isUnclear(d) ? 0 : d.status !== 'confirmed' && d.remedy === 'terminate' ? 1 : d.status !== 'confirmed' ? 2 : 9);
    return [...dpas].filter((d) => score(d) < 9).sort((a, b) => score(a) - score(b)).slice(0, 5);
  }, [dpas]);

  if (dpaCount === 0) {
    return (
      <div className="card empty">
        <h2 className="h2">Start with the sample contract set</h2>
        <p>Load the Ayo Payroll sample to add 41 fictional customer DPAs, 9 approved vendors and the demo Jira tickets.</p>
        <button className="btn btn-primary" onClick={onSeed} disabled={busy}>{busy ? 'Loading…' : 'Load sample data'}</button>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="card hero">
        <div className="card-pad">
          <span className="kicker">Release readiness</span>
          <div className="bigstat">
            <strong className="num">{pct}%</strong>
            <span className="muted">{confirmedCount} of {reviewable} terms confirmed by counsel</span>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Counsel confirmation progress">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="lead">
            A contract term only blocks a release once counsel has confirmed it against the signed clause.
            {unclearCount > 0 && <> {unclearCount} clause{unclearCount > 1 ? 's are' : ' is'} too ambiguous to extract and need{unclearCount > 1 ? '' : 's'} a human decision.</>}
          </p>
          <div className="row" style={{ marginTop: 20 }}>
            {pending > 0 && <button className="btn btn-primary" onClick={onConfirmAll}>Confirm {pending} pending</button>}
            <button className="btn" onClick={onGoRegister}>Open register</button>
          </div>
        </div>
        <div className="card-pad">
          <span className="kicker">Obligation profile</span>
          <div className="bars">
            {profile.rows.map((r) => (
              <div className="bar-row" key={r.label}>
                <span>{r.label}</span>
                <div className="track"><span className={r.cls} style={{ width: `${(r.n / max) * 100}%` }} /></div>
                <span className="v num">{r.n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="kpis" aria-label="Summary">
        <div className="card kpi"><span className="kicker">Customer DPAs</span><b className="num">{dpaCount}</b></div>
        <div className="card kpi"><span className="kicker">Confirmed</span><b className="num">{confirmedCount}</b></div>
        <div className="card kpi"><span className="kicker">Counsel to decide</span><b className="num">{unclearCount}</b></div>
        <div className="card kpi"><span className="kicker">Approved vendors</span><b className="num">{vendorCount}</b></div>
      </section>

      <div className="split">
        <section className="card card-pad">
          <h2 className="h2">Needs attention</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>Ambiguous clauses and high-impact terms first.</p>
          {attention.length === 0 ? (
            <p className="muted" style={{ marginTop: 16 }}>Nothing outstanding. Every extractable term is confirmed.</p>
          ) : (
            <ul className="attn">
              {attention.map((d) => (
                <li key={d.id}>
                  <button onClick={() => onOpen(d)}>
                    <span>
                      <span className="who">{d.customerName}</span>
                      <span className="muted"> · {isUnclear(d) ? 'Clause is ambiguous' : noticeText(d)}</span>
                    </span>
                    <StatusPill d={d} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card card-pad">
          <h2 className="h2">Try it in Jira</h2>
          <ol className="steps">
            <li><span>Create an ENG ticket: “Add session replay to payslip screen using Glimpse”. The issue panel shows a 60-day release hold.</span></li>
            <li><span>Create another: “Upgrade ErrorSentry SDK to v8”. It is an approved vendor, so no hold is raised.</span></li>
            <li><span>Try “Route RelayPost emails via the US”. Three EU/UK-only customers block the move.</span></li>
          </ol>
        </section>
      </div>

      <section className="card card-pad">
        <h2 className="h2">Switch the release hold on</h2>
        <p className="muted" style={{ margin: '4px 0 0', maxWidth: '64ch' }}>
          Jira runs a workflow validator only after an admin adds it to a transition. Do this once for each workflow you want guarded.
        </p>
        <ol className="steps">
          <li><span>Open the Engineering space, then <b>Space settings</b>, then <b>Workflows</b>, and edit the workflow.</span></li>
          <li><span>Click the transition into <b>Done</b> (and any <b>Deployed</b> or <b>Production</b> transition), then open its <b>Validators</b> tab.</span></li>
          <li><span>Choose <b>Add validator</b>, pick <b>Aviso Previo Subprocessor Hold</b>, then <b>Update</b> and <b>Publish</b>.</span></li>
        </ol>
      </section>

      <section className="card card-pad">
        <div className="row spread">
          <div>
            <h2 className="h2">Teamwork Graph</h2>
            <p className="muted" style={{ margin: '4px 0 0', maxWidth: '64ch' }}>
              Each contract is added to the graph as a document and linked to the Jira tickets whose release hold it binds, so Rovo can answer which contracts a ticket touches.
            </p>
          </div>
          {graph?.connected && <button className="btn" disabled={busy} onClick={onSyncGraph}>Sync now</button>}
        </div>
        <div style={{ marginTop: 14 }}>
          {!graph ? null : !graph.connected ? (
            <p className="muted" style={{ margin: 0 }}>Not connected. An admin connects it once under Apps, Connected apps, Aviso Previo, Connections.</p>
          ) : graph.lastSync ? (
            <span className={`pill ${graph.lastSync.ok ? 'ok' : 'warn'}`}>
              {graph.lastSync.ok
                ? `${graph.lastSync.synced} contracts synced, ${graph.lastSync.linkedTickets} ticket${graph.lastSync.linkedTickets === 1 ? '' : 's'} linked · ${new Date(graph.lastSync.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : graph.lastSync.message || 'The last sync failed'}
            </span>
          ) : (
            <p className="muted" style={{ margin: 0 }}>Connected. Waiting for the first sync.</p>
          )}
        </div>
      </section>
    </div>
  );
}
