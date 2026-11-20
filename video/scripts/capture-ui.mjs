// Renders the real built UI (sample data, local mock server) to PNGs for the video.
// Needs admin-ui built first: `npm run build` in the repo root.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
import path from 'node:path';

const ROOT = path.resolve('..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = path.resolve('public/ui');
await mkdir(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const serve = (dir, port) =>
  new Promise((resolve) => {
    const s = createServer(async (req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      try {
        const file = path.join(dir, url === '/' ? 'index.html' : url);
        res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
        res.end(await readFile(file));
      } catch { res.statusCode = 404; res.end('nf'); }
    }).listen(port, () => resolve(s));
  });

const admin = await serve(path.join(ROOT, 'admin-ui/dist'), 4301);
const panel = await serve(path.join(ROOT, 'admin-ui/dist-panel'), 4302);

// Async on purpose: a blocking call would freeze the local server Chrome is loading from.
const shot = async (name, url, w, h, budget = 6000) => {
  await run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--virtual-time-budget=${budget}`, `--window-size=${w},${h}`, '--force-device-scale-factor=2', `--screenshot=${path.join(OUT, name)}`, url], { timeout: 60000 }).catch(() => {});
  console.log('wrote', name);
};

// A harness page that loads the admin in a frame, then clicks a row so the drawer opens.
const drawerPage = async (file, customer) => {
  // Search first (the customer may not be on the first page), then click the row.
  const js = `const f=document.getElementById('f');f.onload=()=>setTimeout(()=>{const w=f.contentWindow,d=f.contentDocument;const st=d.createElement('style');st.textContent='*{animation:none!important;transition:none!important}';d.head.appendChild(st);const i=d.querySelector('input[type=search]');Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(i,${JSON.stringify(customer)});i.dispatchEvent(new w.Event('input',{bubbles:true}));setTimeout(()=>{[...d.querySelectorAll('.trow')].find(r=>r.textContent.includes(${JSON.stringify(customer)})).click()},500)},900)`;
  await writeFile(path.join(ROOT, 'admin-ui/dist/_t', file), `<body style="margin:0;background:#0e0e0f"><iframe id=f src="../index.html#register" style="width:100vw;height:100vh;border:0"></iframe><script>${js}</script></body>`);
};
const panelPage = async (file, state) =>
  writeFile(path.join(ROOT, 'admin-ui/dist-panel/_t', file), `<body style="margin:0;padding:0;background:#1f1f21"><iframe src="../index.html#${state}" style="width:100vw;height:100vh;border:0"></iframe></body>`);

await mkdir(path.join(ROOT, 'admin-ui/dist/_t'), { recursive: true });
await mkdir(path.join(ROOT, 'admin-ui/dist-panel/_t'), { recursive: true });

// Admin, 1500x940 @2x
await shot('admin-overview.png', 'http://localhost:4301/#overview', 1500, 940);
await shot('admin-register.png', 'http://localhost:4301/#register', 1500, 940);
await drawerPage('nordic.html', 'Nordic Logistics');
await shot('admin-drawer-nordic.png', 'http://localhost:4301/_t/nordic.html', 1500, 940, 9000);
await drawerPage('apex.html', 'Apex Health');
await shot('admin-drawer-apex.png', 'http://localhost:4301/_t/apex.html', 1500, 940, 9000);

// Issue panel states, 520x860 @2x
for (const [name, state] of [['panel-hold', 'new'], ['panel-synthetic', 'synthetic'], ['panel-quiet', 'quiet'], ['panel-region', 'location']]) {
  await panelPage(`${state}.html`, state);
  await shot(`${name}.png`, `http://localhost:4302/_t/${state}.html`, 520, 860);
}
admin.close(); panel.close();
