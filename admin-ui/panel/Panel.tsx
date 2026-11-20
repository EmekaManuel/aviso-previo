import React, { useEffect, useState } from 'react';
import { api } from './api';
import type { IssueAssessment } from './types';

const Foot = () => <p className="foot">Sample data · Fictional. Aviso Previo summarizes your contracts. It is not legal advice.</p>;

export default function Panel() {
  const [a, setA] = useState<IssueAssessment | null>(null);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => { api.getAssessment().then(setA).catch(() => setError(true)); }, []);

  if (error) return <div className="panel"><p className="muted">Could not load the assessment. Refresh the issue to retry.</p></div>;
  if (!a) return <div className="panel"><div className="skeleton" style={{ height: 18, width: '40%' }} /><div className="skeleton" style={{ height: 56 }} /><div className="skeleton" style={{ height: 80 }} /></div>;

  const vendor = a.vendor || 'This vendor';
  const goLive = a.earliestGoLiveDate || '—';

  const requestNotice = async () => {
    setBusy(true);
    try {
      const r = await api.createRequest({ issueKey: a.issueKey });
      if (r?.requestKey) setA({ ...a, legalRequestKey: r.requestKey });
    } catch (e: any) {
      setNote(e?.message || 'Could not open the request.');
    } finally { setBusy(false); }
  };
  const applyOverride = async () => {
    const text = reason.trim();
    if (!text) return;
    setBusy(true);
    try {
      await api.override({ issueKey: a.issueKey, overrideReason: text });
      setA({ ...a, overridden: true, overriddenBy: 'Counsel', overrideReason: text });
      setOverriding(false);
    } catch (e: any) {
      setNote(e?.message || 'Could not record the override.');
    } finally { setBusy(false); }
  };

  // ── Nothing to do ─────────────────────────────
  if (a.classification === 'EXISTING_VENDOR_NO_CHANGE' || a.classification === 'UNRELATED') {
    return (
      <div className="panel">
        <div className="section">
          <span className="pill ok">No action needed</span>
          <p>
            {a.classification === 'EXISTING_VENDOR_NO_CHANGE'
              ? `Routine change for approved subprocessor ${vendor}. Hosting is unchanged, so no customer notice is required.`
              : 'No third-party processing or data-location changes detected on this ticket.'}
          </p>
        </div>
        <Foot />
      </div>
    );
  }

  // ── Synthetic data ────────────────────────────
  if (a.classification === 'NO_CUSTOMER_DATA') {
    return (
      <div className="panel">
        <div className="section">
          <span className={`pill ${confirmed ? 'ok' : 'warn'}`}>{confirmed ? 'Confirmed' : 'Confirmation needed'}</span>
          <h2>{vendor} in a test environment</h2>
          <p className="muted">This ticket describes {vendor} running on staging or synthetic data only. If no customer personal data is processed, no notice is required.</p>
          {!confirmed && <div className="actions"><button className="btn btn-primary" onClick={() => setConfirmed(true)}>Confirm synthetic data only</button></div>}
        </div>
        <Foot />
      </div>
    );
  }

  // The register cannot be trusted yet: the release stays blocked.
  if (a.failClosedReason && !a.overridden) {
    return (
      <div className="panel">
        <div className="section">
          <span className="pill risk">Release hold</span>
          <h2>Contract terms are not verified yet</h2>
          <p className="muted">{a.failClosedReason} Ask privacy counsel to review and confirm the register in Aviso Previo Admin.</p>
        </div>
        <Foot />
      </div>
    );
  }

  const open = a.holdActive !== false;
  const awaiting = (a.basis?.pending ?? 0) + (a.basis?.unclear ?? 0);
  const basisNote = a.basis ? (
    <p className="caption">
      Based on {a.basis.confirmed} counsel-confirmed contract{a.basis.confirmed === 1 ? '' : 's'}
      {awaiting > 0 ? `. ${awaiting} more ${awaiting === 1 ? 'is' : 'are'} awaiting counsel review, so this date may move later.` : '.'}
    </p>
  ) : null;
  const holdPill = a.overridden ? <span className="pill warn">Hold overridden</span> : open ? <span className="pill risk">Release hold</span> : <span className="pill ok">{a.classification === 'LOCATION_CHANGE' && !a.affectedCustomers ? 'No restricted customers' : 'Notice window elapsed'}</span>;

  // ── Region change ─────────────────────────────
  if (a.classification === 'LOCATION_CHANGE') {
    const who = a.conflictingCustomers?.length ? a.conflictingCustomers : [];
    return (
      <div className="panel">
        <div className="section">
          {holdPill}
          <h2>{vendor} is moving data processing out of the EU</h2>
          <p className="muted">
            {who.length
              ? `${who.length} customer DPA${who.length === 1 ? '' : 's'} forbid processing outside the EU/UK, so this change needs their agreement first.`
              : 'No confirmed customer contract restricts where this data is processed.'}
          </p>
        </div>
        {who.length > 0 && (
          <div className="golive">
            <span className="kicker">Earliest permitted go-live</span>
            <span className="date">{goLive}</span>
            {basisNote}
          </div>
        )}
        {who.length > 0 && (
          <div className="section">
            <span className="kicker">Customers affected</span>
            <ul className="list">{who.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        )}
        <Foot />
      </div>
    );
  }

  // ── New subprocessor ──────────────────────────
  const stats: [string, string | number, string?][] = [
    ['Customers affected', a.affectedCustomers ?? 0, 'confirmed DPAs'],
    ['Longest notice', `${a.longestNoticeDays ?? 0} days`],
    ['Termination rights', a.terminationRightsCount ?? 0, 'may object and leave'],
    ['Region conflicts', a.locationConflictsCount ?? 0, a.hostingRegion === 'UNKNOWN' ? 'region not stated; assumed outside EU/UK' : 'EU/UK-only DPAs'],
  ];
  return (
    <div className="panel">
      <div className="section">
        {holdPill}
        <h2>New subprocessor: {vendor}</h2>
        <p className="muted">
          {open && !a.overridden
            ? `Customers must be notified before ${vendor} can process their data. The workflow blocks the move to Done until then.`
            : a.overridden ? 'Counsel has released this ticket despite the notice window.' : 'The longest customer notice period has passed.'}
        </p>
      </div>

      <div className="golive">
        <span className="kicker">Earliest permitted go-live</span>
        <span className="date">{goLive}</span>
        <p className="caption">Counted from {a.noticeStartedAt ? new Date(a.noticeStartedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'first assessment'}, using the longest notice window. Code changes cannot move it.</p>
        {basisNote}
        <div className="actions" style={{ alignItems: 'center' }}>
          {a.legalRequestKey ? (
            <span className="row" style={{ gap: 8 }}><span className="muted">Privacy request</span><span className="chipkey">{a.legalRequestKey}</span></span>
          ) : (
            <button className="btn btn-primary" onClick={requestNotice} disabled={busy}>{busy ? 'Opening request…' : 'Notify privacy counsel'}</button>
          )}
        </div>
      </div>

      <dl className="stats">
        {stats.map(([k, v, s]) => (
          <div key={k}><dt>{k}</dt><dd>{v}{s && <small>{s}</small>}</dd></div>
        ))}
      </dl>

      {a.sampleClauseQuote && (
        <div className="section">
          <span className="kicker">Binding clause · {a.sampleClauseCustomer}</span>
          <blockquote className="clause" style={{ margin: 0 }}>{a.sampleClauseQuote}</blockquote>
        </div>
      )}

      <div className="section">
        <div className="actions">
          <button className="linkbtn" onClick={() => setDraft(!draft)}>{draft ? 'Hide draft notice' : 'View draft customer notice'}</button>
          {!a.overridden && !overriding && <button className="linkbtn" onClick={() => setOverriding(true)}>Override hold</button>}
        </div>

        {draft && (
          <div className="draft">
            <div><span className="kicker">Subject</span><p style={{ marginTop: 4, fontWeight: 600 }}>{a.draftNotice?.subject}</p></div>
            <div><span className="kicker">Body</span>
              <pre style={{ marginTop: 4 }}>{a.draftNotice?.body}</pre>
            </div>
          </div>
        )}

        {a.overridden && (
          <div className="draft"><span className="kicker">Hold overridden</span><p>{a.overriddenBy}: {a.overrideReason}</p></div>
        )}

        {overriding && (
          <div className="draft">
            <label className="field">
              <span className="kicker">Override justification</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Vendor agreed to an EU data residency addendum" />
              <span className="caption">Recorded against {a.issueKey} and visible to counsel.</span>
            </label>
            <div className="actions">
              <button className="btn btn-primary" disabled={!reason.trim() || busy} onClick={applyOverride}>Override hold</button>
              <button className="btn btn-ghost" onClick={() => setOverriding(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {note && <p className="caption" role="alert">{note}</p>}
      <Foot />
    </div>
  );
}
