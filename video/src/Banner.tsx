import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, MONO, Mark, SANS, SERIF } from './ui';

/** README banner, 2400x900. Real UI on the right, the notice-window motif underneath. */
export const Banner: React.FC = () => {
  const chips = ['Jira workflow validator', 'Confluence', 'Rovo agent + MCP', 'Teamwork Graph'];
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS, color: C.text, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1100px 700px at 78% 40%, rgba(79,209,193,0.13), transparent 62%), radial-gradient(900px 600px at 8% 100%, rgba(180,172,240,0.07), transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '80px 80px', WebkitMaskImage: 'radial-gradient(ellipse at 60% 40%, black 15%, transparent 75%)' }} />

      <div style={{ position: 'absolute', left: 130, top: 120, display: 'flex', alignItems: 'center', gap: 22 }}>
        <Mark size={92} at={-100} />
        <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em' }}>Aviso Previo</span>
      </div>

      <div style={{ position: 'absolute', left: 130, top: 255, width: 1180, fontSize: 112, fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.045em' }}>
        Ship on the date<br />your contracts allow.
      </div>
      <div style={{ position: 'absolute', left: 132, top: 530, width: 1000, fontSize: 34, lineHeight: 1.4, color: C.sub, fontWeight: 400 }}>
        A Jira release hold that knows what your customer contracts promise about new subprocessors.
      </div>
      <div style={{ position: 'absolute', left: 130, top: 690, display: 'flex', gap: 14 }}>
        {chips.map((c) => (
          <span key={c} style={{ fontSize: 24, color: C.sub, padding: '11px 22px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'rgba(20,20,22,.8)' }}>{c}</span>
        ))}
      </div>

      {/* real UI */}
      <div style={{ position: 'absolute', left: 1300, top: 80, width: 700, height: 440, borderRadius: 24, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 60px 160px rgba(0,0,0,.7), 0 0 120px rgba(79,209,193,.10)', background: '#0e0e10' }}>
        <div style={{ height: 40, background: '#131315', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 99, background: '#3a3a3f' }} />)}
          <span style={{ marginLeft: 10, fontSize: 15, color: C.dim }}>Aviso Previo Admin · Register</span>
        </div>
        <div style={{ width: 700, height: 400, overflow: 'hidden', position: 'relative' }}>
          <Img src={staticFile('ui/admin-drawer-nordic.png')} style={{ position: 'absolute', width: 1500, left: -870, top: -20 }} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1770, top: 230, width: 480, height: 520, borderRadius: 24, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 60px 160px rgba(0,0,0,.8)', background: '#121214', padding: 20, WebkitMaskImage: 'linear-gradient(to bottom, black 78%, transparent 100%)' }}>
        <Img src={staticFile('ui/panel-hold.png')} style={{ width: '100%', display: 'block', borderRadius: 12 }} />
      </div>

      {/* the notice window */}
      <div style={{ position: 'absolute', left: 130, right: 130, top: 826, height: 2, background: C.line }} />
      <div style={{ position: 'absolute', left: 130, right: 130, top: 825, height: 4, background: C.teal, borderRadius: 4, boxShadow: `0 0 26px ${C.teal}66` }} />
      <div style={{ position: 'absolute', left: 120, top: 817, width: 20, height: 20, borderRadius: 99, background: C.teal }} />
      <div style={{ position: 'absolute', right: 120, top: 817, width: 20, height: 20, borderRadius: 99, background: C.text }} />
      <div style={{ position: 'absolute', left: 130, top: 850, fontFamily: MONO, fontSize: 20, letterSpacing: '0.14em', color: C.dim }}>NOTICE GIVEN</div>
      <div style={{ position: 'absolute', right: 130, top: 850, fontFamily: MONO, fontSize: 20, letterSpacing: '0.14em', color: C.dim }}>EARLIEST GO-LIVE</div>
      <div style={{ position: 'absolute', right: 130, top: 60, fontFamily: SERIF, fontSize: 1, opacity: 0 }}>.</div>
    </AbsoluteFill>
  );
};
