import React from 'react';
import type { Vendor } from './types';

const fmt = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(+d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function Vendors({ vendors }: { vendors: Vendor[] }) {
  if (!vendors.length)
    return <div className="card empty"><h2 className="h2">No approved vendors</h2><p>Vendors appear once the sample data is loaded.</p></div>;
  return (
    <div className="vgrid">
      {vendors.map((v) => {
        const eu = /\b(EU|UK)\b/.test(v.hostingLocation ?? '') && !/\b(US|Nigeria)\b/.test(v.hostingLocation ?? '');
        return (
          <article className="card vcard" key={v.key}>
            <div className="row spread">
              <h3>{v.name}</h3>
              {v.hostingLocation && <span className={`pill plain ${eu ? 'ok' : 'warn'}`}>{eu ? 'EU/UK hosted' : 'Outside EU/UK'}</span>}
            </div>
            <span className="muted">{v.category}</span>
            <dl>
              {v.dataProcessed && <div><dt>Data processed</dt><dd>{v.dataProcessed}</dd></div>}
              <div><dt>Hosting</dt><dd>{v.hostingLocation ?? '—'}</dd></div>
              <div><dt>On subprocessor list since</dt><dd>{fmt(v.publishedDate)}</dd></div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}
