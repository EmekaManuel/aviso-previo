// Generates the narration with ElevenLabs, scene by scene, with word-level timing.
//   node scripts/vo.mjs            generate every scene
//   node scripts/vo.mjs --only block   regenerate one scene
//   node scripts/vo.mjs --voices   list the voices your key can use
// The key is read from video/.env (ELEVENLABS_API_KEY=...) or the environment. Never printed or committed.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

async function loadEnv() {
  try {
    for (const line of (await readFile('.env', 'utf8')).split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}
await loadEnv();

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('No ELEVENLABS_API_KEY. Create video/.env with one line:  ELEVENLABS_API_KEY=your_key');
  process.exit(1);
}
const api = (p, init = {}) => fetch(`https://api.elevenlabs.io${p}`, { ...init, headers: { 'xi-api-key': KEY, 'content-type': 'application/json', ...(init.headers || {}) } });

if (process.argv.includes('--voices')) {
  const r = await api('/v1/voices');
  if (!r.ok) { console.error('Could not list voices:', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  for (const v of (await r.json()).voices) console.log(`${v.voice_id}  ${v.name}  [${v.category}]  ${v.labels?.accent ?? ''} ${v.labels?.description ?? ''}`);
  process.exit(0);
}

const VOICE = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'; // George: warm, calm narrator
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const { scenes } = JSON.parse(await readFile('script.json', 'utf8'));
let vo = { scenes: {} };
try { vo = JSON.parse(await readFile('src/vo.json', 'utf8')); } catch {}
await mkdir('public/vo', { recursive: true });

for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  if (only && only !== s.id) continue;
  process.stdout.write(`${s.id} ... `);
  const res = await api(`/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    body: JSON.stringify({
      text: s.text,
      model_id: MODEL,
      previous_text: scenes[i - 1]?.text,
      next_text: scenes[i + 1]?.text,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true, speed: 0.97 },
    }),
  });
  if (!res.ok) { console.error('\nElevenLabs said', res.status, (await res.text()).slice(0, 300)); process.exit(1); }
  const data = await res.json();
  const file = `vo/${s.id}.mp3`;
  await writeFile(path.join('public', file), Buffer.from(data.audio_base64, 'base64'));

  // Characters to words, with the time each word starts and ends.
  const a = data.alignment, words = [];
  let cur = null;
  a.characters.forEach((ch, k) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', start: a.character_start_times_seconds[k], end: 0 };
    cur.w += ch; cur.end = a.character_end_times_seconds[k];
  });
  if (cur) words.push(cur);

  const probed = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path.join('public', file)]).toString().trim();
  vo.scenes[s.id] = { file, duration: Number(probed), words };
  console.log(`${Number(probed).toFixed(1)}s, ${words.length} words`);
}
await writeFile('src/vo.json', JSON.stringify(vo, null, 1));
console.log('Done. Preview with: npm run studio   Render with: npm run render');
