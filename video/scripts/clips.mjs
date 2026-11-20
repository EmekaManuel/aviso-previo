// Records which live clips exist in public/live so the edit can use them. Run before studio/render.
import { readdir, writeFile } from 'node:fs/promises';
const files = await readdir('public/live').catch(() => []);
const has = (n) => files.find((f) => f.startsWith(n) && /\.(mp4|mov|webm)$/i.test(f)) ?? null;
const clips = { block: has('block') ? `live/${has('block')}` : null };
await writeFile('src/clips.json', JSON.stringify(clips, null, 1));
console.log('clips:', clips);
