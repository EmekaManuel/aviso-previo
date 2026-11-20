import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, Chapter, Counter, Frame, MONO, Mark, Pill, Reveal, Ring, SANS, SERIF, Sfx, Words, ease, easeIO, p } from './ui';
import { beat } from './timing';
import clips from './clips.json';

const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: '0 30px 90px rgba(0,0,0,.45)', ...style }}>{children}</div>
);

/* ───────────────────────── 1. The hook ───────────────────────── */
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const b = (k: string, n = 0, o = 0) => beat('hook', k, n, o);
  const tFri = b('friday'), tTicket = b('ticket'), tForty = b('forty'), tSixty = b('sixty'), tNobody = b('nobody'), tClick = b('click');
  const flip = p(f, tClick + 6, 10);
  const cursorT = p(f, tClick - 46, 40, easeIO);
  const cx = interpolate(cursorT, [0, 1], [1010, 905]), cy = interpolate(cursorT, [0, 1], [640, 292]);
  const ripple = p(f, tClick, 26);
  const line = p(f, tSixty, 70, easeIO);
  const shipped = p(f, tClick + 6, 14);
  return (
    <AbsoluteFill>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.22} />
      <Sfx at={tClick + 6} src="audio/tick.wav" volume={0.5} />
      <Reveal at={tFri - 6} dy={10} style={{ position: 'absolute', left: 120, top: 120, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: C.red, opacity: 0.45 + 0.55 * Math.abs(Math.sin(f / 14)) }} />
        <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.16em', color: C.sub }}>FRIDAY · 4:52 PM</span>
      </Reveal>

      <Reveal at={tTicket - 4} dy={40} dur={34} style={{ position: 'absolute', left: 120, top: 220, width: 900 }}>
        <Card style={{ padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: '#2f6fed', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>✓</span>
            <span style={{ fontFamily: MONO, fontSize: 24, color: C.sub }}>ENG-1</span>
            <span style={{ marginLeft: 'auto', position: 'relative', width: 120, height: 40 }}>
              <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#2a2a2e', color: C.sub, fontSize: 20, fontWeight: 600, opacity: 1 - flip, transform: `scale(${1 - 0.1 * flip})` }}>To Do</span>
              <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#1f3d2b', color: C.green, fontSize: 20, fontWeight: 600, opacity: flip, transform: `scale(${0.9 + 0.1 * flip})` }}>✓ Done</span>
            </span>
          </div>
          <Words text="Add session replay to the payslip screen using Glimpse" at={tTicket + 4} size={46} weight={600} style={{ marginTop: 28 }} line={1.18} />
          <div style={{ marginTop: 24, fontSize: 22, color: C.dim }}>Task · Engineering · Ayo Payroll (a fictional company)</div>
        </Card>
      </Reveal>

      {/* cursor */}
      <div style={{ position: 'absolute', left: cx, top: cy, opacity: p(f, tClick - 50, 12) * (1 - p(f, tClick + 40, 14)), filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.6))' }}>
        <svg width="30" height="38" viewBox="0 0 18 28"><path d="M0 0 0 22 5.5 17 10 27 13.5 25.5 9 16 16.5 16Z" fill="#fff" stroke="#000" strokeWidth="1.2" /></svg>
      </div>
      <div style={{ position: 'absolute', left: 905 - 60 * ripple, top: 292 - 60 * ripple, width: 120 * ripple, height: 120 * ripple, borderRadius: 999, border: `3px solid ${C.green}`, opacity: ripple > 0 && ripple < 1 ? 1 - ripple : 0 }} />

      <Reveal at={tForty - 10} dy={30} style={{ position: 'absolute', left: 1130, top: 190, width: 700 }}>
        <div style={{ fontFamily: SANS, fontSize: 280, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.05em', color: C.text }}><Counter to={40} at={tForty} dur={44} /></div>
        <div style={{ fontSize: 38, color: C.sub, marginTop: 4, fontWeight: 500 }}>enterprise contracts</div>
        <div style={{ fontSize: 34, color: C.teal, marginTop: 22, fontWeight: 500 }}>each one promises 60 days' written notice</div>
      </Reveal>

      {/* The notice window */}
      <div style={{ position: 'absolute', left: 120, top: 860, width: 1680, height: 2, background: C.line }} />
      <div style={{ position: 'absolute', left: 120, top: 859, width: 1680 * line, height: 4, background: C.teal, borderRadius: 4, boxShadow: `0 0 24px ${C.teal}66` }} />
      <div style={{ position: 'absolute', left: 1800 - 10, top: 851, width: 20, height: 20, borderRadius: 99, background: C.text, opacity: line > 0.97 ? 1 : 0.25 }} />
      <div style={{ position: 'absolute', left: 120 - 10, top: 851, width: 20, height: 20, borderRadius: 99, background: shipped > 0.5 ? C.red : C.teal, boxShadow: shipped > 0.5 ? `0 0 26px ${C.red}` : 'none', opacity: p(f, tSixty - 8, 10) }} />
      <Reveal at={tSixty + 50} dy={8} style={{ position: 'absolute', left: 1800 - 420, top: 886, width: 420, textAlign: 'right', fontSize: 24, color: C.sub }}>Day 60 · earliest permitted go-live</Reveal>
      <Reveal at={tSixty + 10} dy={8} style={{ position: 'absolute', left: 120, top: 886, fontSize: 24, color: C.sub }}>Day 0</Reveal>
      <Reveal at={tNobody} dy={10} style={{ position: 'absolute', left: 120, top: 790, fontSize: 30, fontWeight: 600, color: C.amber, opacity: 1 - shipped }}>Legal isn't told.</Reveal>
      <Reveal at={tClick + 8} dy={10} style={{ position: 'absolute', left: 120, top: 790, fontSize: 30, fontWeight: 600, color: C.red }}>Shipped on day 0.</Reveal>
      <Reveal at={tClick + 34} dy={8} style={{ position: 'absolute', left: 560, top: 790, width: 700, textAlign: 'center', fontSize: 30, fontWeight: 600, color: C.red }}>60 days of promised notice, skipped</Reveal>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. The gap ───────────────────────── */
const CONTRACTS = ['Nordic Logistics AS', 'Bavaria HealthTech GmbH', 'Stockholm Retail Group AB', 'Caledonia Finance Ltd', 'Apex Health Services PLC', 'Atlas Marine Services BV'];
const TICKETS: [string, string, string][] = [['ENG-1', 'Add session replay to the payslip screen', 'To Do'], ['ENG-2', 'Upgrade ErrorSentry SDK to v8', 'Done'], ['ENG-3', 'Move RelayPost sending region from EU to US', 'To Do'], ['ENG-4', 'Evaluate Glimpse in sandbox, synthetic data', 'To Do']];

export const Gap: React.FC = () => {
  const f = useCurrentFrame();
  const b = (k: string, n = 0, o = 0) => beat('gap', k, n, o);
  const tL = b('counsel'), tR = b('engineers'), tTwo = b('two'), tJoin = b('connects');
  const join = p(f, tJoin, 36, easeIO);
  return (
    <AbsoluteFill>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.2} />
      <Chapter n="01" title="THE GAP" />
      <Words text="Contracts in one tool. Work in another." at={10} size={62} style={{ position: 'absolute', left: 120, top: 150, width: 1400 }} />
      <Reveal at={tL - 8} dy={36} style={{ position: 'absolute', left: 150, top: 330, width: 640 }}>
        <Card style={{ padding: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: '#2f6fed' }} /><span style={{ fontSize: 24, fontWeight: 600 }}>Confluence · Customer contracts</span>
          </div>
          {CONTRACTS.map((c, i) => (
            <Reveal key={c} at={tL + 6 + i * 5} dy={10} dur={18}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: `1px solid ${C.line}`, fontSize: 23, color: C.sub }}>
                <span style={{ color: C.dim }}>▤</span>{c}
              </div>
            </Reveal>
          ))}
          <div style={{ marginTop: 10, fontSize: 21, color: C.dim }}>…41 data processing agreements</div>
        </Card>
      </Reveal>
      <Reveal at={tR - 8} dy={36} style={{ position: 'absolute', left: 1130, top: 330, width: 640 }}>
        <Card style={{ padding: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: '#2f6fed' }} /><span style={{ fontSize: 24, fontWeight: 600 }}>Jira · Engineering</span>
          </div>
          {TICKETS.map(([k, t, s], i) => (
            <Reveal key={k} at={tR + 6 + i * 6} dy={10} dur={18}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: `1px solid ${C.line}`, fontSize: 22 }}>
                <span style={{ fontFamily: MONO, color: C.dim, fontSize: 19 }}>{k}</span><span style={{ color: C.sub, flex: 1 }}>{t}</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: s === 'Done' ? C.green : C.dim }}>{s}</span>
              </div>
            </Reveal>
          ))}
        </Card>
      </Reveal>
      {/* the missing link */}
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width="1920" height="1080">
        <line x1="800" y1="560" x2="1120" y2="560" stroke={C.dim} strokeWidth="3" strokeDasharray="10 12" opacity={p(f, tTwo, 20) * (1 - join)} />
        <line x1="800" y1="560" x2="1120" y2="560" stroke={C.teal} strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - join} style={{ filter: `drop-shadow(0 0 10px ${C.teal}88)` }} />
      </svg>
      <div style={{ position: 'absolute', left: 960 - 44, top: 560 - 44, width: 88, height: 88, borderRadius: 99, border: `2px solid ${join > 0.5 ? C.teal : C.dim}`, background: C.bg, display: 'grid', placeItems: 'center', opacity: p(f, tTwo, 20), transform: `scale(${0.85 + 0.15 * Math.min(1, join * 1.4)})` }}>
        {join > 0.4 ? <Mark size={58} at={tJoin + 14} /> : <span style={{ fontSize: 40, color: C.dim }}>?</span>}
      </div>
      <Reveal at={tJoin + 30} dy={10} style={{ position: 'absolute', left: 760, top: 630, width: 400, textAlign: 'center', fontSize: 26, fontWeight: 600, color: C.teal }}>Aviso Previo</Reveal>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. Counsel ───────────────────────── */
export const Counsel: React.FC = () => {
  const f = useCurrentFrame();
  const b = (k: string, n = 0, o = 0) => beat('counsel', k, n, o);
  const tBeside = b('beside'), tClause = b('clause'), tRej = b('rejected'), tVague = b('vague'), tDecide = b('decide'), tConf = b('confluence');
  return (
    <AbsoluteFill>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.2} />
      <Chapter n="02" title="FOR PRIVACY COUNSEL" />
      <Frame left={340} top={100} width={1240} ar={3000 / 1880} at={4} kind="sample" label="Aviso Previo Admin · Register"
        stack={[{ src: 'ui/admin-register.png', at: 0 }, { src: 'ui/admin-drawer-nordic.png', at: tBeside - 26 }, { src: 'ui/admin-drawer-apex.png', at: tVague - 18 }]}>
        <Ring box={[63, 16, 36, 16.5]} at={tBeside} label="Terms beside the clause" side="left" hideAt={tVague - 18} />
        <Ring box={[63, 35.5, 36, 27.5]} at={tClause} label="As signed" side="left" hideAt={tVague - 18} />
        <Reveal at={tRej} dy={14} style={{ position: 'absolute', left: '4%', top: '72%', opacity: 1 - p(f, tVague - 18, 12) }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 600, color: '#06201c', background: C.teal, padding: '12px 22px', borderRadius: 999 }}>✓ Quote found word for word</span>
        </Reveal>
        <Ring box={[63.5, 9.2, 12.5, 3.8]} at={tVague + 8} color={C.red} />
        <Ring box={[64, 53.3, 34.5, 14]} at={tDecide} label="Nothing guessed" side="left" color={C.amber} />
      </Frame>
      <Reveal at={tConf} dy={10} style={{ position: 'absolute', left: 340, top: 944, width: 1240, textAlign: 'center', opacity: 0 }}>{' '}</Reveal>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. Engineer ───────────────────────── */
export const Engineer: React.FC = () => {
  const f = useCurrentFrame();
  const b = (k: string, n = 0, o = 0) => beat('engineer', k, n, o);
  const tHold = b('hold'), tForty = b('forty'), tSixty = b('sixty'), tDate = b('nineteenth'), tCode = b('code');
  return (
    <AbsoluteFill>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.2} />
      <Chapter n="03" title="FOR ENGINEERS" />
      <Reveal at={tHold - 6} dy={20} style={{ position: 'absolute', left: 110, top: 170 }}>
        <Pill color={C.red} style={{ fontSize: 28 }}><span style={{ fontSize: 56, fontWeight: 600, color: C.text, letterSpacing: '-0.03em' }}>Release hold</span></Pill>
      </Reveal>
      <Reveal at={tForty - 6} dy={24} style={{ position: 'absolute', left: 110, top: 320 }}>
        <div style={{ fontSize: 150, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.05em' }}><Counter to={40} at={tForty} dur={34} /></div>
        <div style={{ fontSize: 32, color: C.sub, marginTop: 6 }}>confirmed contracts apply</div>
      </Reveal>
      <Reveal at={tSixty - 6} dy={24} style={{ position: 'absolute', left: 110, top: 540 }}>
        <div style={{ fontSize: 110, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.04em' }}><Counter to={60} at={tSixty} dur={30} /> <span style={{ fontSize: 48, fontWeight: 300, color: C.sub }}>days</span></div>
        <div style={{ fontSize: 32, color: C.sub, marginTop: 6 }}>longest notice window</div>
      </Reveal>
      <Reveal at={tDate - 6} dy={24} style={{ position: 'absolute', left: 110, top: 740 }}>
        <div style={{ fontSize: 84, fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.04em' }}>19 January 2027</div>
        <div style={{ fontSize: 32, color: C.teal, marginTop: 8, fontWeight: 500 }}>earliest permitted go-live</div>
      </Reveal>

      <Frame left={1290} top={118} width={470} pad={14} ar={1040 / 1720} at={tHold - 14} kind="sample" label="Jira issue panel" stack={[{ src: 'ui/panel-hold.png', at: 0 }]} dim={0}>
        <Ring box={[0, 0, 58, 4.4]} at={tHold} color={C.red} />
        <Ring box={[0, 18.5, 62, 10]} at={tDate} />
        <Ring box={[0, 48.2, 100, 13]} at={tForty} />
        <Ring box={[0, 28.8, 82, 4.8]} at={tCode} color={C.amber} />
      </Frame>
      <Frame left={790} top={250} width={420} pad={12} ar={1012 / 1294} at={tCode - 8} kind="live" label="A live Jira site" stack={[{ src: 'live/panel-relaypost.png', at: 0 }]} drift={0.02} />
      <Reveal at={tCode + 6} dy={10} style={{ position: 'absolute', left: 790, top: 862, width: 420, textAlign: 'center', fontSize: 24, color: C.sub }}>
        Calculated in code. Never by the model.
      </Reveal>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. The block ───────────────────────── */
const MESSAGE = 'Aviso Previo release hold: ENG-1 introduces new subprocessor "Glimpse". 40 customer DPA(s) require prior notice (longest: 60 days). Earliest permitted deployment: 19 January 2027.';

export const Block: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const b = (k: string, n = 0, o = 0) => beat('block', k, n, o);
  const tRef = b('refuses'), tOver = b('override'), tSyn = b('synthetic'), tRead = b('read'), tConf = b('confirmed'), tFail = b('fails');
  const chars = Math.floor(MESSAGE.length * p(f, tRef + 8, 90, Easing.linear));
  const clip = (clips as any).block as string | null;
  const chips: [number, string, string, string][] = [
    [tOver, 'Counsel override', 'A written reason, recorded: who and why', C.amber],
    [tSyn, 'Synthetic data only', 'Still needs a person to confirm it', C.violet],
    [tRead, "Can't read the ticket", 'The release stays blocked', C.red],
    [tConf, 'No contracts confirmed', 'The release stays blocked', C.red],
  ];
  return (
    <AbsoluteFill>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.2} />
      <Sfx at={tRef + 6} src="audio/pop.wav" volume={0.45} />
      <Chapter n="04" title="THE HOLD" />
      {clip ? (
        <div style={{ position: 'absolute', left: 110, top: 130, width: 1020, opacity: p(f, 4, 30), transform: `translateY(${(1 - p(f, 4, 30)) * 40}px)` }}>
          <div style={{ borderRadius: 22, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 50px 140px rgba(0,0,0,.65)', background: '#0e0e10' }}>
            <div style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 16px', background: '#131315', borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 16, color: C.dim }}>Moving ENG-1 to Done</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', color: C.teal }}>● LIVE SITE</span>
            </div>
            <OffthreadVideo src={staticFile(clip)} style={{ width: '100%', display: 'block' }} muted />
          </div>
        </div>
      ) : (
        <Reveal at={4} dy={40} dur={30} style={{ position: 'absolute', left: 110, top: 150, width: 1020 }}>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 20px', background: '#131315', borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 16, color: C.dim }}>Moving ENG-1 to Done</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', color: C.sub }}>VALIDATOR MESSAGE · AS RETURNED BY THE APP</span>
            </div>
            <div style={{ padding: '44px 48px 52px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ width: 54, height: 54, borderRadius: 99, background: '#3a1a1a', border: `2px solid ${C.red}`, display: 'grid', placeItems: 'center', color: C.red, fontSize: 30, fontWeight: 700, transform: `scale(${0.6 + 0.4 * p(f, tRef, 16)})` }}>!</span>
                <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', opacity: p(f, tRef, 16) }}>Jira refuses the transition</span>
              </div>
              <div style={{ marginTop: 34, fontFamily: MONO, fontSize: 28, lineHeight: 1.5, color: C.text, borderLeft: `3px solid ${C.red}`, paddingLeft: 26, minHeight: 250 }}>
                {MESSAGE.slice(0, chars)}<span style={{ opacity: chars < MESSAGE.length ? 1 : 0 }}>▍</span>
              </div>
            </div>
          </Card>
        </Reveal>
      )}
      <div style={{ position: 'absolute', left: 1230, top: 150, width: 580 }}>
        {chips.map(([at, title, sub, color], i) => (
          <Reveal key={title} at={at - 4} dy={26} style={{ marginBottom: 22 }}>
            <Card style={{ padding: '24px 28px', borderLeft: `4px solid ${color}` }}>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</div>
              <div style={{ fontSize: 24, color: C.sub, marginTop: 6 }}>{sub}</div>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal at={tFail - 6} dy={20} style={{ position: 'absolute', left: 110, top: 790, fontSize: 54, fontWeight: 600, letterSpacing: '-0.03em', color: C.teal }}>It fails closed.</Reveal>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. Evidence ───────────────────────── */
const PIPE: [string, string][] = [['Confluence page', 'The contract, as written'], ['Claude reads it', 'Extracts terms, quotes the clause'], ['Scored against a label', 'Every answer, all 41 contracts']];

export const Evidence: React.FC = () => {
  const f = useCurrentFrame();
  const b = (k: string, n = 0, o = 0) => beat('evidence', k, n, o);
  const tMeas = b('measured'), tClaude = b('claude'), tScored = b('scored'), tDecl = b('declined'), tFixed = b('fixed'), tZero = b('zero'), tPoint = b('point');
  const pipeOut = 1 - p(f, tDecl - 34, 14);
  const final = p(f, tPoint - 10, 22);
  return (
    <AbsoluteFill>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.2} />
      <Sfx at={tFixed} src="audio/pop.wav" volume={0.4} />
      <Chapter n="05" title="THE EVIDENCE" />
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', opacity: pipeOut }}>
        <Words text="Does the model read contracts correctly?" at={tMeas - 6} size={64} style={{ position: 'absolute', left: 120, top: 170, width: 1500 }} />
        {PIPE.map(([t, s], i) => {
          const at = [tMeas + 24, tClaude, tScored][i];
          return (
            <React.Fragment key={t}>
              <Reveal at={at} dy={30} style={{ position: 'absolute', left: 120 + i * 590, top: 400, width: 500 }}>
                <Card style={{ padding: '34px 34px', borderTop: `3px solid ${i === 1 ? C.teal : C.line}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 18, color: C.dim, letterSpacing: '0.14em' }}>{`0${i + 1}`}</div>
                  <div style={{ fontSize: 38, fontWeight: 600, marginTop: 10, letterSpacing: '-0.02em' }}>{t}</div>
                  <div style={{ fontSize: 26, color: C.sub, marginTop: 8 }}>{s}</div>
                </Card>
              </Reveal>
              {i < 2 && (
                <svg style={{ position: 'absolute', left: 120 + i * 590 + 505, top: 480 }} width="80" height="40">
                  <line x1="0" y1="20" x2="64" y2="20" stroke={C.teal} strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p(f, at + 16, 22)} />
                  <path d="M54 10 66 20 54 30" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round" opacity={p(f, at + 30, 8)} />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <Frame left={310} top={150} width={1300} ar={2240 / 1000} at={tDecl - 30} kind="live" label="Aviso Previo Admin · Evaluation" drift={0.02}
        stack={[{ src: 'live/eval-run1.png', at: 0 }, { src: 'live/eval-run2.png', at: tFixed - 8 }]}>
        <Ring box={[84, 36, 13.5, 17]} at={tDecl} color={C.amber} hideAt={tFixed - 10} />
        <Ring box={[77, 29.5, 19.5, 6.5]} at={tDecl + 22} label="12 declined" side="left" color={C.amber} hideAt={tFixed - 10} />
        <Ring box={[7.5, 37, 41, 6.5]} at={tZero} label="0 wrong" side="right" />
      </Frame>
      <div style={{ position: 'absolute', left: 310, top: 800, width: 1300, display: 'flex', gap: 24, opacity: p(f, tZero, 18) * (1 - final) }}>
        {[['41/41', 'notice period and unit'], ['0', 'confident wrong answers'], ['41/41', 'clauses quoted word for word']].map(([n, l]) => (
          <Card key={l} style={{ flex: 1, padding: '14px 24px', display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 46, fontWeight: 300, color: C.teal, letterSpacing: '-0.03em' }}>{n}</span><span style={{ fontSize: 23, color: C.sub }}>{l}</span>
          </Card>
        ))}
      </div>
      <AbsoluteFill style={{ background: `rgba(11,11,12,${0.92 * final})`, display: 'grid', placeItems: 'center', opacity: final > 0 ? 1 : 0 }}>
        <Words text="Quote it, or say you can't." at={tPoint} size={104} weight={400} serif align="center" style={{ maxWidth: 1500 }} stagger={3.2} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. Agents and the graph ───────────────────────── */
export const Agents: React.FC = () => {
  const f = useCurrentFrame();
  const b = (k: string, n = 0, o = 0) => beat('agents', k, n, o);
  const tAsk = b('ask'), tAgent = b('agent'), tCommit = b('commits'), tAmb = b('ambiguous'), tDecide = b('counsel', 1), tGraph = b('teamwork');
  const N = 41, R = 150, cx = 1450, cy = 330;
  return (
    <AbsoluteFill>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.2} />
      <Chapter n="06" title="FOR TEAMS AND AGENTS" />
      <Frame left={130} top={100} width={404} pad={12} ar={892 / 1668} at={tAsk} kind="live" label="Rovo chat" stack={[{ src: 'live/agent-glimpse.png', at: 0 }]} drift={0.02}>
        <Ring box={[4, 33, 92, 41]} at={tCommit} />
      </Frame>
      <Frame left={578} top={100} width={374} pad={12} ar={790 / 1588} at={tAmb - 8} kind="live" label="Same agent" stack={[{ src: 'live/agent-apex.png', at: 0 }]} drift={0.02}>
        <Ring box={[6, 57, 88, 12]} at={tDecide} color={C.amber} />
      </Frame>
      {/* the graph */}
      <Reveal at={tGraph - 6} dy={14} style={{ position: 'absolute', left: 1050, top: 96, width: 700, textAlign: 'center', fontSize: 28, fontWeight: 600, color: C.sub, letterSpacing: '0.04em' }}>Every contract, added to the Teamwork Graph</Reveal>
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width="1920" height="1080">
        {Array.from({ length: N }).map((_, i) => {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          const at = tGraph + (i * 1.1);
          const t = p(f, at, 22);
          const x = cx + Math.cos(a) * R * (1.6 - 0.6 * t), y = cy + Math.sin(a) * R * (1.6 - 0.6 * t);
          return (
            <g key={i} opacity={t}>
              <line x1={x} y1={y} x2={cx} y2={cy} stroke={C.teal} strokeOpacity={0.22 * t} strokeWidth="1.5" />
              <rect x={x - 7} y={y - 9} width="14" height="18" rx="3" fill={C.panel2} stroke={C.teal} strokeWidth="1.6" />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={58} fill={C.bg} stroke={C.teal} strokeWidth="3" opacity={p(f, tGraph + 20, 20)} style={{ filter: `drop-shadow(0 0 24px ${C.teal}66)` }} />
      </svg>
      <Reveal at={tGraph + 26} dy={8} style={{ position: 'absolute', left: cx - 58, top: cy - 16, width: 116, textAlign: 'center', fontSize: 17, fontWeight: 600, lineHeight: 1.15, color: C.teal }}>Teamwork<br />Graph</Reveal>
      <Frame left={1100} top={640} width={700} ar={2198 / 370} at={tGraph + 52} kind="live" label="Sync result" stack={[{ src: 'live/graph-sync.png', at: 0 }]} drift={0.01} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 8. Close ───────────────────────── */
export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const b = (k: string, n = 0, o = 0) => beat('close', k, n, o);
  const tShip = b('ship');
  const out = 1 - p(f, durationInFrames - 34, 30, easeIO);
  const chips = ['Jira workflow validator', 'Confluence', 'Rovo agent and MCP', 'Teamwork Graph', 'Forge LLM'];
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Sfx at={0} src="audio/whoosh.wav" volume={0.18} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Mark size={190} at={4} />
        <Reveal at={22} dy={20} style={{ fontSize: 124, fontWeight: 600, letterSpacing: '-0.04em', marginTop: 6 }}>Aviso Previo</Reveal>
        <Words text="Ship on the date your contracts allow." at={tShip} size={58} weight={300} color={C.sub} align="center" style={{ marginTop: 22 }} />
        <div style={{ display: 'flex', gap: 14, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1400 }}>
          {chips.map((c, i) => (
            <Reveal key={c} at={tShip + 20 + i * 6} dy={14}>
              <span style={{ display: 'inline-block', fontSize: 24, color: C.sub, padding: '12px 22px', borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel }}>{c}</span>
            </Reveal>
          ))}
        </div>
        <Reveal at={tShip + 56} dy={10} style={{ marginTop: 56, fontSize: 26, color: C.dim, textAlign: 'center' }}>
          Apps for Business Teams · Atlassian Codegeist 2026
          <div style={{ color: C.teal, marginTop: 10, fontWeight: 500 }}>Install link in the description</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};
