import React from 'react';
import { Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadSerif } from '@remotion/google-fonts/SourceSerif4';
import { FPS, PAD_IN, captionChunks } from './timing';

export const SANS = loadInter('normal', { weights: ['300', '400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;
export const SERIF = loadSerif('normal', { weights: ['400', '600'], subsets: ['latin'] }).fontFamily;
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const C = {
  bg: '#0b0b0c', panel: '#141416', panel2: '#1a1a1d', line: '#2a2a2e', text: '#ededea', sub: '#b4b4af', dim: '#76766f',
  teal: '#4fd1c1', tealDeep: '#0b7a70', amber: '#e5b04e', red: '#f08178', violet: '#b4acf0', green: '#6fd08c',
};

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
export const p = (f: number, start: number, dur = 22, e: (t: number) => number = ease) =>
  interpolate(f, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });

/** Fade up into place. */
export const Reveal: React.FC<{ at: number; dy?: number; dur?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, dy = 28, dur = 26, style, children }) => {
  const t = p(useCurrentFrame(), at, dur);
  return <div style={{ opacity: t, transform: `translateY(${(1 - t) * dy}px)`, ...style }}>{children}</div>;
};

/** Words rise out of a mask one after another. */
export const Words: React.FC<{ text: string; at: number; size?: number; weight?: number; color?: string; serif?: boolean; stagger?: number; line?: number; align?: 'left' | 'center'; style?: React.CSSProperties }> = ({
  text, at, size = 64, weight = 600, color = C.text, serif, stagger = 2.4, line = 1.12, align = 'left', style,
}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{ fontSize: size, fontWeight: weight, color, fontFamily: serif ? SERIF : SANS, lineHeight: line, textAlign: align, letterSpacing: serif ? '-0.01em' : '-0.025em', ...style }}>
      {words.map((w, i) => {
        const t = p(f, at + i * stagger, 24);
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.14em', marginBottom: '-0.14em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - t) * 108}%)`, opacity: t }}>{w}{i < words.length - 1 ? ' ' : ''}</span>
          </span>
        );
      })}
    </div>
  );
};

export const Counter: React.FC<{ to: number; at: number; dur?: number; suffix?: string; style?: React.CSSProperties }> = ({ to, at, dur = 40, suffix = '', style }) => {
  const t = p(useCurrentFrame(), at, dur, easeIO);
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{Math.round(to * t)}{suffix}</span>;
};

export const Chapter: React.FC<{ n: string; title: string; at?: number }> = ({ n, title, at = 6 }) => (
  <Reveal at={at} dy={12} style={{ position: 'absolute', left: 84, top: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
    <span style={{ fontFamily: MONO, fontSize: 20, color: C.teal, letterSpacing: '0.12em' }}>{n}</span>
    <span style={{ width: 36, height: 1, background: C.line }} />
    <span style={{ fontSize: 20, letterSpacing: '0.22em', color: C.sub, fontWeight: 500 }}>{title}</span>
  </Reveal>
);

export const Pill: React.FC<{ color?: string; children: React.ReactNode; dot?: boolean; style?: React.CSSProperties }> = ({ color = C.sub, children, dot = true, style }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 500, color, ...style }}>
    {dot && <span style={{ width: 10, height: 10, borderRadius: 99, background: color }} />}
    {children}
  </span>
);

/** The brand mark, drawn on. */
export const Mark: React.FC<{ size: number; at: number; stroke?: string }> = ({ size, at, stroke = C.text }) => {
  const f = useCurrentFrame();
  const a = p(f, at, 34, easeIO), b = p(f, at + 20, 22, easeIO);
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 74 48 22 72 74" stroke={stroke} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - a} />
      <path d="M35 58h26" stroke={C.teal} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - b} />
    </svg>
  );
};

type Stack = { src: string; at: number };
/** A window with provenance. Real UI with sample data, or the live site. Overlays use percent coordinates of the image. */
export const Frame: React.FC<{
  stack: Stack[]; ar: number; width: number; left: number; top: number; at: number;
  kind: 'live' | 'sample'; label: string; pad?: number; drift?: number; dim?: number; children?: React.ReactNode;
}> = ({ stack, ar, width, left, top, at, kind, label, pad = 0, drift = 0.03, dim = 0, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = p(f, at, 34);
  const scale = 1 + drift * (f / durationInFrames);
  const inner = width - pad * 2;
  const height = inner / ar;
  return (
    <div style={{ position: 'absolute', left, top, width, opacity: t * (1 - dim), transform: `translateY(${(1 - t) * 44}px) scale(${(0.97 + 0.03 * t) * scale})`, transformOrigin: '50% 40%' }}>
      <div style={{ borderRadius: 22, overflow: 'hidden', background: '#0e0e10', border: `1px solid ${C.line}`, boxShadow: '0 50px 140px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.02), 0 0 90px rgba(79,209,193,.05)' }}>
        <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#131315', borderBottom: `1px solid ${C.line}` }}>
          {['#3a3a3f', '#3a3a3f', '#3a3a3f'].map((c, i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 99, background: c }} />)}
          <span style={{ marginLeft: 10, fontSize: 16, color: C.dim, fontWeight: 500, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{label}</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', whiteSpace: 'nowrap', color: kind === 'live' ? C.teal : C.sub }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: kind === 'live' ? C.teal : C.dim, boxShadow: kind === 'live' ? `0 0 12px ${C.teal}` : 'none' }} />
            {kind === 'live' ? 'LIVE SITE' : 'REAL UI · SAMPLE DATA'}
          </span>
        </div>
        <div style={{ padding: pad, background: pad ? '#121214' : undefined }}>
          <div style={{ position: 'relative', width: inner, height }}>
            {stack.map((s, i) => (
              <Img key={s.src} src={staticFile(s.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === 0 ? 1 : p(f, s.at, 14, easeIO) }} />
            ))}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/** A callout ring that draws itself, with a label. Box is [x, y, w, h] in percent of the image. */
export const Ring: React.FC<{ box: [number, number, number, number]; at: number; label?: string; side?: 'top' | 'bottom' | 'left' | 'right'; color?: string; hideAt?: number }> = ({ box, at, label, side = 'top', color = C.teal, hideAt }) => {
  const f = useCurrentFrame();
  const t = p(f, at, 26, easeIO);
  const out = hideAt === undefined ? 1 : 1 - p(f, hideAt, 12);
  const pos: React.CSSProperties =
    side === 'top' ? { bottom: '100%', left: 0, marginBottom: 14 } :
    side === 'bottom' ? { top: '100%', left: 0, marginTop: 14 } :
    side === 'left' ? { right: '100%', top: '50%', marginRight: 14, transform: 'translateY(-50%)' } :
    { left: '100%', top: '50%', marginLeft: 14, transform: 'translateY(-50%)' };
  return (
    <div style={{ position: 'absolute', left: `${box[0]}%`, top: `${box[1]}%`, width: `${box[2]}%`, height: `${box[3]}%`, opacity: out }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <rect x="0" y="0" width="100%" height="100%" rx="10" fill={color} fillOpacity={0.07 * t} stroke={color} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} vectorEffect="non-scaling-stroke" />
      </svg>
      {label && (
        <div style={{ position: 'absolute', whiteSpace: 'nowrap', ...pos, opacity: p(f, at + 14, 14), transform: `${pos.transform ?? ''} translateY(${(1 - p(f, at + 14, 14)) * 8}px)` }}>
          <span style={{ display: 'inline-block', fontSize: 24, fontWeight: 600, color: '#06201c', background: color, padding: '8px 16px', borderRadius: 999, letterSpacing: '-0.01em' }}>{label}</span>
        </div>
      )}
    </div>
  );
};

/** One cue of sound. */
export const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.5 }) => (
  <Sequence from={at} durationInFrames={FPS * 2} layout="none">
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

/** Subtitles, driven by the narration's own word timings. */
export const Captions: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame();
  const t = f / FPS - PAD_IN;
  const chunk = captionChunks(id).find((c) => t >= c[0].start - 0.12 && t <= c[c.length - 1].end + 0.3);
  if (!chunk) return null;
  const a = Math.min(1, (t - chunk[0].start + 0.12) / 0.2);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 52, display: 'flex', justifyContent: 'center', opacity: a }}>
      <div style={{ maxWidth: 1380, textAlign: 'center', fontSize: 36, lineHeight: 1.3, fontWeight: 500, letterSpacing: '-0.01em', textShadow: '0 2px 18px rgba(0,0,0,.95), 0 0 2px rgba(0,0,0,.9)' }}>
        {chunk.map((w, i) => (
          <span key={i} style={{ color: t >= w.start - 0.02 ? C.text : 'rgba(237,237,234,.42)', transition: 'none' }}>{w.w}{' '}</span>
        ))}
      </div>
    </div>
  );
};
