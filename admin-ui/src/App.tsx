import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { AdminState, Benchmark, DPA } from './types';
import { Overview } from './Overview';
import { Register } from './Register';
import { Vendors } from './Vendors';
import { Evaluation } from './Evaluation';
import { Drawer } from './Drawer';

type Tab = 'overview' | 'register' | 'vendors' | 'evaluation';
const EMPTY: AdminState = { dpaCount: 0, vendorCount: 0, confirmedCount: 0, unclearCount: 0, dpas: [], vendors: [] };

export default function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const h = window.location.hash.slice(1) as Tab;
    return ['overview', 'register', 'vendors', 'evaluation'].includes(h) ? h : 'overview';
  });
  const [data, setData] = useState<AdminState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState<Benchmark | null>(null);
  const [toast, setToast] = useState('');

  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3200); };

  const load = useCallback(async () => {
    try { setData(await api.getAdminState()); }
    catch (e) { console.error(e); say('Could not load contracts. Try refreshing.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try { await fn(); await load(); say(done); }
    catch (e: any) { say(e?.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  const selected: DPA | undefined = data.dpas.find((d) => d.id === selectedId);
  const pending = Math.max(data.dpaCount - data.unclearCount - data.confirmedCount, 0);

  const tabs: [Tab, string, number?][] = [
    ['overview', 'Overview'],
    ['register', 'Register', data.dpaCount || undefined],
    ['vendors', 'Vendors', data.vendorCount || undefined],
    ['evaluation', 'Evaluation'],
  ];

  return (
    <div className="shell">
      <div className="bar">
      <nav className="tabs" role="tablist" aria-label="Sections">
        {tabs.map(([id, label, n]) => (
          <button key={id} role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}{n !== undefined && <span className="count num">{n}</span>}
          </button>
        ))}
      </nav>
        <div className="row bar-actions">
          <span className="pill plain">Sample data · Fictional</span>
          {data.dpaCount > 0 && (
            <button className="btn" disabled={busy} onClick={() => run(api.seed, 'Sample data reloaded')}>Reload sample</button>
          )}
        </div>
      </div>

      <main>
        {loading ? (
          <div className="stack"><div className="skeleton" style={{ height: 220 }} /><div className="skeleton" style={{ height: 96 }} /></div>
        ) : tab === 'overview' ? (
          <Overview
            data={data}
            busy={busy}
            onSeed={() => run(api.seed, 'Sample data loaded')}
            onConfirmAll={() => run(api.confirmAll, `${pending} contracts confirmed`)}
            onOpen={(d) => setSelectedId(d.id)}
            onGoRegister={() => setTab('register')}
          />
        ) : tab === 'register' ? (
          <Register dpas={data.dpas} onOpen={(d) => setSelectedId(d.id)} />
        ) : tab === 'vendors' ? (
          <Vendors vendors={data.vendors} />
        ) : (
          <Evaluation
            score={score}
            total={data.dpaCount}
            running={busy}
            onRun={() => run(async () => setScore(await api.benchmark()), 'Evaluation complete')}
          />
        )}
      </main>

      <footer className="footer">
        <span>Aviso Previo summarizes your contracts. It is not legal advice.</span>
        <span>Sample data · Fictional</span>
      </footer>

      {selected && (
        <Drawer
          dpa={selected}
          busy={busy}
          onClose={() => setSelectedId(null)}
          onConfirm={(id) => run(() => api.confirm(id), 'Terms confirmed').then(() => setSelectedId(null))}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
