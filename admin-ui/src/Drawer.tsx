import React, { useEffect, useRef } from 'react';
import type { DPA } from './types';
import { CloseIcon, StatusPill, Tags, isUnclear, noticeText, remedyText } from './ui';

/** Wrap "thirty (30) calendar days" style phrases so counsel can see what was extracted. */
function highlight(clause: string) {
  const re = /(\b[\w-]+ \(\d+\) (?:calendar |business |working )?days\b|\b\d+ (?:calendar |business |working )?days\b)/gi;
  return clause.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>));
}

interface Props { dpa: DPA; onClose: () => void; onConfirm: (id: string) => void; busy: boolean }

export function Drawer({ dpa, onClose, onConfirm, busy }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);

  const unclear = isUnclear(dpa);
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
            <span className="kicker">Extracted terms</span>
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

          {unclear ? (
            <div className="note warn"><b>Counsel to decide.</b> This wording is ambiguous, so no date is inferred and it cannot trigger a release hold until a person resolves it.</div>
          ) : dpa.status !== 'confirmed' ? (
            <p className="muted" style={{ margin: 0 }}>Compare the highlighted wording with the extracted terms. Confirming makes this contract count toward release holds.</p>
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
