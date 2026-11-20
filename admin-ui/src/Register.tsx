import React, { useEffect, useMemo, useState } from 'react';
import type { DPA } from './types';
import { ChevronRight, SearchIcon, SortIcon, StatusPill, Tags, isUnclear, noticeText } from './ui';

type Status = 'all' | 'confirmed' | 'draft' | 'unclear';
type SortKey = 'customer' | 'notice' | 'status';
const PAGE = 12;

const STATUS_CHIPS: { id: Status; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'draft', label: 'Awaiting review' },
  { id: 'unclear', label: 'Counsel to decide' },
];

const rank = (d: DPA) => (isUnclear(d) ? 0 : d.status === 'confirmed' ? 2 : 1);

export function Register({ dpas, onOpen }: { dpas: DPA[]; onOpen: (d: DPA) => void }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [termination, setTermination] = useState(false);
  const [euOnly, setEuOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'customer', dir: 'asc' });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = dpas.filter((d) => {
      if (needle && !`${d.customerName} ${d.country}`.toLowerCase().includes(needle)) return false;
      if (status === 'confirmed' && d.status !== 'confirmed') return false;
      if (status === 'unclear' && !isUnclear(d)) return false;
      if (status === 'draft' && (d.status === 'confirmed' || isUnclear(d))) return false;
      if (termination && d.remedy !== 'terminate') return false;
      if (euOnly && d.locationRestriction !== 'EU_UK_ONLY') return false;
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      if (sort.key === 'notice') return ((a.noticePeriodDays ?? 999) - (b.noticePeriodDays ?? 999)) * dir;
      if (sort.key === 'status') return (rank(a) - rank(b)) * dir;
      return a.customerName.localeCompare(b.customerName) * dir;
    });
  }, [dpas, q, status, termination, euOnly, sort]);

  useEffect(() => setPage(0), [q, status, termination, euOnly, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const visible = rows.slice(page * PAGE, page * PAGE + PAGE);

  const th = (key: SortKey, label: string) => (
    <button onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))} aria-label={`Sort by ${label}`}>
      {label} <SortIcon dir={sort.key === key ? sort.dir : undefined} />
    </button>
  );

  return (
    <div>
      <div className="toolbar">
        <label className="search">
          <span className="sr-only">Search contracts</span>
          <SearchIcon />
          <input type="search" placeholder="Search customer or country" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Status filter">
          {STATUS_CHIPS.map((c) => (
            <button key={c.id} className="chip" aria-pressed={status === c.id} onClick={() => setStatus(c.id)}>{c.label}</button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Term filters">
          <button className="chip" aria-pressed={termination} onClick={() => setTermination(!termination)}>Termination right</button>
          <button className="chip" aria-pressed={euOnly} onClick={() => setEuOnly(!euOnly)}>EU/UK only</button>
        </div>
      </div>

      <div className="card table" role="table" aria-label="Customer data processing agreements">
        <div className="thead" role="row">
          <span role="columnheader">{th('customer', 'Customer')}</span>
          <span role="columnheader">{th('notice', 'Notice')}</span>
          <span role="columnheader">Objection</span>
          <span role="columnheader">Rights & limits</span>
          <span role="columnheader">{th('status', 'Status')}</span>
          <span />
        </div>
        {visible.length === 0 ? (
          <div className="empty"><p>No contracts match these filters.</p></div>
        ) : (
          visible.map((d) => (
            <button className="trow" role="row" key={d.id} onClick={() => onOpen(d)}>
              <span className="cust"><b>{d.customerName}</b><span>{d.country}</span></span>
              <span className="c-notice num"><span className="lbl">Notice · </span>{noticeText(d)}</span>
              <span className="c-obj num">{d.objectionWindowDays ? `${d.objectionWindowDays} days` : '—'}</span>
              <span className="tags">{d.remedy === 'terminate' || d.locationRestriction === 'EU_UK_ONLY' || d.noticeUnit === 'business_days' ? <Tags d={d} /> : <span className="muted none">None</span>}</span>
              <span className="c-status"><StatusPill d={d} /></span>
              <span className="chev"><ChevronRight /></span>
            </button>
          ))
        )}
        <div className="pager">
          <span className="num">{rows.length === 0 ? '0 results' : `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, rows.length)} of ${rows.length}`}</span>
          <span className="row">
            <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
          </span>
        </div>
      </div>
    </div>
  );
}
