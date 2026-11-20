import React from 'react';
import type { DPA } from './types';

export const isUnclear = (d: DPA) => d.status === 'unclear' || d.noticeUnit === 'unclear';

export const unitLabel = (u: DPA['noticeUnit']) =>
  u === 'business_days' ? 'business days' : u === 'calendar_days' ? 'calendar days' : '';

export const noticeText = (d: DPA) =>
  d.noticePeriodDays ? `${d.noticePeriodDays} ${unitLabel(d.noticeUnit)}` : 'Not stated';

export const remedyText = (r: string) =>
  ({
    terminate: 'Object and terminate',
    good_faith_negotiation: 'Good-faith negotiation',
    reasonable_efforts: 'Reasonable efforts',
    unspecified: 'Not specified',
  } as Record<string, string>)[r] ?? r;

export const StatusPill = ({ d }: { d: DPA }) =>
  d.status === 'confirmed' ? (
    <span className="pill ok">Confirmed</span>
  ) : isUnclear(d) ? (
    <span className="pill risk">Counsel to decide</span>
  ) : (
    <span className="pill warn">Awaiting review</span>
  );

export const Tags = ({ d }: { d: DPA }) => (
  <>
    {d.remedy === 'terminate' && <span className="pill risk plain">Termination right</span>}
    {d.locationRestriction === 'EU_UK_ONLY' && <span className="pill info plain">EU/UK only</span>}
    {d.noticeUnit === 'business_days' && <span className="pill plain">Business days</span>}
  </>
);

const I = (p: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
);
export const SearchIcon = () => <I><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></I>;
export const ChevronRight = () => <I><path d="m9 6 6 6-6 6" /></I>;
export const CloseIcon = () => <I><path d="M6 6l12 12M18 6 6 18" /></I>;
export const SortIcon = ({ dir }: { dir?: 'asc' | 'desc' }) => (
  <I width="12" height="12" opacity={dir ? 1 : 0.35}><path d={dir === 'desc' ? 'm6 9 6 6 6-6' : 'm6 15 6-6 6 6'} /></I>
);

export const Mark = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Aviso Previo">
    <rect width="96" height="96" rx="22" fill="#101C2C" />
    <path d="M27 71 48 25 69 71" fill="none" stroke="#F4F1EA" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34.5 57h27" fill="none" stroke="#3CCFBF" strokeWidth="7" strokeLinecap="round" />
    <circle cx="48" cy="25" r="6.5" fill="#F2B544" stroke="#101C2C" strokeWidth="3" />
  </svg>
);
