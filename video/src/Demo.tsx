import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Agents, Block, Close, Counsel, Engineer, Evidence, Gap, Hook } from './scenes';
import { C, Captions, SANS } from './ui';
import { FPS, OVERLAP, PAD_IN, SCENES, STARTS, TOTAL, sceneFrames } from './timing';

const COMPONENTS: Record<string, React.FC> = { hook: Hook, gap: Gap, counsel: Counsel, engineer: Engineer, block: Block, evidence: Evidence, agents: Agents, close: Close };

const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(1200px 720px at ${30 + 8 * Math.sin(f / 260)}% ${22 + 6 * Math.cos(f / 310)}%, rgba(79,209,193,0.075), transparent 62%), radial-gradient(900px 620px at ${82 + 5 * Math.cos(f / 280)}% 92%, rgba(180,172,240,0.05), transparent 62%)` }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '80px 80px', backgroundPosition: `${(f * 0.12) % 80}px ${(f * 0.06) % 80}px`, WebkitMaskImage: 'radial-gradient(ellipse at 50% 42%, black 25%, transparent 82%)', maskImage: 'radial-gradient(ellipse at 50% 42%, black 25%, transparent 82%)' }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 260px rgba(0,0,0,.65)' }} />
      <div style={{ position: 'absolute', right: 84, top: 66, fontFamily: SANS, fontSize: 16, letterSpacing: '0.08em', color: C.dim }}>
        AYO PAYROLL IS A FICTIONAL COMPANY · NOT LEGAL ADVICE
      </div>
    </AbsoluteFill>
  );
};

const Shell: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const last = index === SCENES.length - 1;
  const fadeIn = interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = last ? 1 : interpolate(f, [durationInFrames - OVERLAP, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });
  const s = SCENES[index];
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut), fontFamily: SANS, color: C.text }}>
      {children}
      <Captions id={s.id} />
      {s.file && (
        <Sequence from={Math.round(PAD_IN * FPS)} layout="none">
          <Audio src={staticFile(s.file)} volume={1} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export const Demo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Backdrop />
      {SCENES.map((s, i) => {
        const Scene = COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={STARTS[i]} durationInFrames={sceneFrames(s)}>
            <Shell index={i}><Scene /></Shell>
          </Sequence>
        );
      })}
      <Audio
        src={staticFile('audio/bed.wav')}
        volume={(f) => 0.5 * Math.min(1, f / 90) * Math.min(1, Math.max(0, (TOTAL - f) / 120))}
      />
    </AbsoluteFill>
  );
};
