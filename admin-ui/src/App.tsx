import React, { useCallback, useEffect, useState } from 'react';
import { api, loadSample } from './api';
import type { AdminState, DPA, GraphStatus, ScoreRow } from './types';
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
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [evalRunning, setEvalRunning] = useState(false);
  const [evalFinished, setEvalFinished] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [graph, setGraph] = useState<GraphStatus | null>(null);
  const [toast, setToast] = useState('');

  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3200); };

  const load = useCallback(async () => {
    api.getGraphStatus().then(setGraph).catch(() => setGraph(null));
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

  const seed = async () => {
    setBusy(true);
    try {
      // A reload refreshes the register and contract pages only; the Jira tickets already exist.
      await loadSample(setSeedMsg, { skipJira: data.dpaCount > 0 });
      await load();
      say('Sample data loaded');
    } catch (e: any) {
      say(e?.message || 'Loading the sample failed.');
    } finally {
      setSeedMsg('');
      setBusy(false);
    }
  };

  const runEvaluation = async () => {
    setRows([]);
    setEvalFinished(false);
    setEvalRunning(true);
    try {
      let offset = 0;
      for (;;) {
        const batch = await api.evalBatch(offset);
        setRows((prev) => [...prev, ...batch.rows]);
        if (batch.done) break;
        offset = batch.nextOffset;
      }
      setEvalFinished(true);
    } catch (e: any) {
      say(e?.message || 'The evaluation stopped.');
    } finally {
      setEvalRunning(false);
    }
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
            <button className="btn" disabled={busy} onClick={seed}>{seedMsg ? 'Loading…' : 'Reload sample'}</button>
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
            onSeed={seed}
            onConfirmAll={() => run(api.confirmAll, `${pending} contracts confirmed`)}
            onOpen={(d) => setSelectedId(d.id)}
            onGoRegister={() => setTab('register')}
            graph={graph}
            onSyncGraph={() => run(() => api.syncGraph(), 'Synced to the Teamwork Graph')}
          />
        ) : tab === 'register' ? (
          <Register dpas={data.dpas} onOpen={(d) => setSelectedId(d.id)} />
        ) : tab === 'vendors' ? (
          <Vendors vendors={data.vendors} />
        ) : (
          <Evaluation rows={rows} total={data.dpaCount} running={evalRunning} finished={evalFinished} onRun={runEvaluation} />
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
          onResolve={(id, days, unit) => run(() => api.resolve(id, days, unit), 'Clause resolved and confirmed').then(() => setSelectedId(null))}
          onApply={(id) => run(() => api.applyExtraction(id), 'Terms updated and sent back for review').then(() => setSelectedId(null))}
        />
      )}
      {(toast || seedMsg) && <div className="toast" role="status">{seedMsg || toast}</div>}
    </div>
  );
}
