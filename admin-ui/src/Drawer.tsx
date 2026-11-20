import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { DPA, ExtractionCheck } from './types';
import { CloseIcon, StatusPill, Tags, isUnclear, noticeText, remedyText } from './ui';

/** Wrap "thirty (30) calendar days" style phrases so counsel can see what was extracted. */
function highlight(clause: string) {
  const re = /(\b[\w-]+ \(\d+\) (?:calendar |business |working )?days\b|\b\d+ (?:calendar |business |working )?days\b)/gi;
  return clause.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>));
}

interface Props {
  dpa: DPA;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onResolve: (id: string, days: number, unit: 'calendar_days' | 'business_days') => void;
  onApply: (id: string) => void;
  busy: boolean;
}

const read = (c: ExtractionCheck['extracted']) =>
  c.unclear ? 'Unclear' : `${c.noticePeriodDays} ${c.noticeUnit === 'business_days' ? 'business' : 'calendar'} days`;

export function Drawer({ dpa, onClose, onConfirm, onResolve, onApply, busy }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [check, setCheck] = useState<ExtractionCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [days, setDays] = useState('');
  const [unit, setUnit] = useState<'calendar_days' | 'business_days'>('calendar_days');

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);

  const unclear = isUnclear(dpa);
  const allMatch = check && Object.values(check.matches).every(Boolean) && check.extracted.clauseVerified;
  const dayCount = Number(days);
  const canResolve = Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 365;

  const runCheck = async () => {
    setChecking(true);
    setCheckError('');
    setCheck(null);
    try { setCheck(await api.extract(dpa.id)); }
    catch (e: any) { setCheckError(e?.message || 'Could not read the contract.'); }
    finally { setChecking(false); }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${dpa.customerName} contract terms`} tabIndex={-1} ref={ref}>
        <header className="drawer-head">
          <div>
            <span className="kicker">{dpa.id} · {dpa.country}</span>
            <h2 className="h2" style={{ fontSize: 24, marginTop: 4 }}>{dpa.customerName}</h2>
            <div className="row" style={{ marginTop: 10 }}><StatusPill d={dpa} /><Tags d={dpa} /></div>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </header>

        <div className="drawer-body">
          <section>
            <span className="kicker">Terms in the register</span>
            <dl className="facts" style={{ marginTop: 12 }}>
              <div><dt>Notice period</dt><dd className="num">{noticeText(dpa)}</dd></div>
              <div><dt>Objection window</dt><dd className="num">{dpa.objectionWindowDays ? `${dpa.objectionWindowDays} days` : 'Not stated'}</dd></div>
              <div><dt>Customer remedy</dt><dd>{remedyText(dpa.remedy)}</dd></div>
              <div><dt>Data location</dt><dd>{dpa.locationRestriction === 'EU_UK_ONLY' ? 'EU/UK only' : 'No restriction'}</dd></div>
            </dl>
          </section>

          <section>
            <span className="kicker">Clause as signed</span>
            <blockquote className="clause" style={{ marginTop: 12 }}>{highlight(dpa.exactClause)}</blockquote>
          </section>

          <section>
            <div className="row spread">
              <span className="kicker">Check against Confluence</span>
              <button className="btn" onClick={runCheck} disabled={checking || !dpa.confluencePageId}>{checking ? 'Reading…' : check ? 'Read again' : 'Read with Claude'}</button>
            </div>
            {!dpa.confluencePageId && <p className="muted" style={{ margin: '10px 0 0' }}>This contract has no Confluence page yet. Reload the sample data to write it.</p>}
            {checkError && <div className="note warn" style={{ marginTop: 12 }}>{checkError}</div>}
            {check && (
              <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                <dl className="facts">
                  <div><dt>Claude read</dt><dd className="num">{read(check.extracted)} {check.matches.notice && check.matches.unit ? '✓' : '≠'}</dd></div>
                  <div><dt>Remedy</dt><dd>{remedyText(check.extracted.remedy)} {check.matches.remedy ? '✓' : '≠'}</dd></div>
                  <div><dt>Location</dt><dd>{check.extracted.locationRestriction === 'EU_UK_ONLY' ? 'EU/UK only' : 'No restriction'} {check.matches.location ? '✓' : '≠'}</dd></div>
                  <div><dt>Quoted clause</dt><dd>{check.extracted.clauseVerified ? 'Found word for word ✓' : 'Not found in the page ≠'}</dd></div>
                </dl>
                {allMatch ? (
                  <p className="muted" style={{ margin: 0 }}>Claude's reading of the Confluence page matches the register.</p>
                ) : (
                  <div className="note warn">
                    Claude's reading differs from the register. Check the clause above, then keep the register or use Claude's reading, which sends the terms back to review.
                    <div style={{ marginTop: 10 }}><button className="btn" disabled={busy} onClick={() => onApply(dpa.id)}>Use Claude's reading</button></div>
                  </div>
                )}
              </div>
            )}
          </section>

          {unclear ? (
            <section className="note warn">
              <b>Counsel to decide.</b> This wording gives no number of days, so none is inferred and it cannot count toward a release hold. Enter the notice period you read into it to confirm the contract.
              <div className="row" style={{ marginTop: 12 }}>
                <input aria-label="Notice period in days" type="number" min={1} max={365} placeholder="Days" value={days} onChange={(e) => setDays(e.target.value)} style={{ width: 90, height: 34, borderRadius: 6, border: '1px solid var(--line-strong)', background: 'transparent', padding: '0 10px' }} />
                <select aria-label="Day type" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)} style={{ height: 34, borderRadius: 6, border: '1px solid var(--line-strong)', background: 'transparent', padding: '0 8px' }}>
                  <option value="calendar_days">calendar days</option>
                  <option value="business_days">business days</option>
                </select>
                <button className="btn btn-primary" disabled={!canResolve || busy} onClick={() => onResolve(dpa.id, dayCount, unit)}>Resolve and confirm</button>
              </div>
            </section>
          ) : dpa.status !== 'confirmed' ? (
            <p className="muted" style={{ margin: 0 }}>Compare the highlighted wording with the terms. Confirming makes this contract count toward release holds.</p>
          ) : null}
        </div>

        <footer className="drawer-foot">
          <button className="btn" onClick={onClose}>Close</button>
          {!unclear && dpa.status !== 'confirmed' && (
            <button className="btn btn-primary" disabled={busy} onClick={() => onConfirm(dpa.id)}>Confirm terms</button>
          )}
        </footer>
      </aside>
    </>
  );
}
