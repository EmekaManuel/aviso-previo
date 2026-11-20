// Renders SVG brand assets to PNG. Usage: node scripts/build-assets.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const jobs = [
  ['assets/icons/app-icon.svg', 'assets/icons/app-icon-144.png', 144, 144],
  ['assets/icons/app-icon.svg', 'assets/icons/app-icon-512.png', 512, 512],
  ['assets/icons/app-icon.svg', 'assets/icons/favicon-32.png', 32, 32],
  ['assets/logo/aviso-previo-logo.svg', 'assets/logo/aviso-previo-logo.png', 1440, null],
  ['assets/social/cover.svg', 'assets/social/cover-1500x1000.png', 1500, 1000],
];

for (const [src, out, w, h] of jobs) {
  const svg = await readFile(src);
  const img = sharp(svg, { density: 300 }).resize(w, h ?? undefined);
  await writeFile(out, await img.png().toBuffer());
  console.log('wrote', out);
}
