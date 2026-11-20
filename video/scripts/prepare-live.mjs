// Crops the author's real screenshots of the live Jira site into video/public/live/.
// Source images are looked up in LIVE_SRC (default: the session's image folder).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = process.env.LIVE_SRC || '/private/tmp/claude-501/-Users-emekamanuel-Documents-aviso-previo/95173abf-6b8c-4c82-8ff0-84aa8b2c4418/images';
const OUT = path.resolve('public/live');
await mkdir(OUT, { recursive: true });

// [source file, output name, crop {left, top, width, height} or null for the whole image]
const jobs = [
  ['44.png', 'eval-run1.png', { left: 640, top: 640, width: 2240, height: 1000 }], // 29/41, 12 disagreements
  ['45.png', 'eval-declined.png', { left: 647, top: 560, width: 2220, height: 1100 }], // the twelve contracts it declined
  ['47.png', 'eval-run2.png', { left: 640, top: 640, width: 2240, height: 1000 }], // 41/41
  ['18.png', 'panel-relaypost.png', { left: 0, top: 20, width: 1012, height: 1294 }], // live region-change panel
  ['38.png', 'agent-glimpse.png', null], // live Rovo agent answer
  ['42.png', 'agent-apex.png', null], // live Rovo agent: the ambiguous clause
  ['41.png', 'graph-sync.png', null], // live Teamwork Graph sync result
];
for (const [src, out, crop] of jobs) {
  let img = sharp(path.join(SRC, src));
  if (crop) img = img.extract(crop);
  await img.png().toFile(path.join(OUT, out));
  console.log('wrote', out);
}
