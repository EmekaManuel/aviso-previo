import script from '../script.json';
import voData from './vo.json';

export const FPS = 30;
export const PAD_IN = 0.55; // seconds of picture before the narration starts
export const PAD_OUT = 1.1; // seconds of picture after it ends
export const OVERLAP = 12; // frames of cross-dissolve between scenes

export type Word = { w: string; start: number; end: number };
export type SceneInfo = { id: string; text: string; duration: number; words: Word[]; file: string | null };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');

/** Until the real narration exists, spread the words evenly so the picture can still be built and previewed. */
function estimate(text: string): { duration: number; words: Word[] } {
  let t = 0;
  const words = text.split(/\s+/).map((w) => {
    const start = t;
    t += 0.38 + (/[.:?]$/.test(w) ? 0.4 : /,$/.test(w) ? 0.18 : 0);
    return { w, start, end: t - 0.05 };
  });
  return { duration: t, words };
}

export const SCENES: SceneInfo[] = script.scenes.map((s) => {
  const real = (voData as any).scenes?.[s.id];
  if (real) return { id: s.id, text: s.text, duration: real.duration, words: real.words, file: real.file };
  const e = estimate(s.text);
  return { id: s.id, text: s.text, duration: e.duration, words: e.words, file: null };
});

export const sceneFrames = (s: SceneInfo) => Math.ceil((s.duration + PAD_IN + PAD_OUT) * FPS);
export const STARTS: number[] = SCENES.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + sceneFrames(SCENES[i - 1]) - OVERLAP);
  return acc;
}, []);
export const TOTAL = STARTS[STARTS.length - 1] + sceneFrames(SCENES[SCENES.length - 1]);

/** The local frame (inside its scene) at which the nth word starting with `key` is spoken. */
export function beat(id: string, key: string, nth = 0, offset = 0): number {
  const s = SCENES.find((x) => x.id === id)!;
  const k = norm(key);
  let seen = 0;
  for (const w of s.words) {
    if (norm(w.w).startsWith(k)) {
      if (seen === nth) return Math.max(0, Math.round((PAD_IN + w.start) * FPS) + offset);
      seen++;
    }
  }
  return Math.round(PAD_IN * FPS);
}

/** Subtitle lines: sentence-sized chunks of at most ~11 words. */
export function captionChunks(id: string): Word[][] {
  const s = SCENES.find((x) => x.id === id)!;
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (const w of s.words) {
    cur.push(w);
    if (/[.?!:]$/.test(w.w) || cur.length >= 11) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}
