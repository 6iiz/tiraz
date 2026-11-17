// render.mjs · turns a page into numbered frames. Serves one folder locally, opens the page, asks it for each frame and screenshots it.
//   node render.mjs --root <folder> --page <path?query> --out <dir> [--fps 60] [--from 0] [--to <end>] [--size 1080x1920] [--png]
//   node render.mjs --root <folder> --page <path?query> --out <dir> --at 0,1.5,3        (a few stills to look at before a full render)
//   --mount name=<folder>   serves a second folder under /name/ (repeatable)
// The page must set window.stage = { ready: true, end: <seconds>, frame(t) }. Needs `playwright`: run  npm install  once in the kit folder.
// Browser: the path in TIRAZ_CHROMIUM, else installed Chrome, else Playwright's own Chromium. Nothing leaves the machine: the server listens on 127.0.0.1 only.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const argv = process.argv.slice(2);
const all = (k) => argv.flatMap((v, i) => (v === '--' + k ? [argv[i + 1]] : []));
const opt = (k, d) => all(k).at(-1) ?? d, flag = (k) => argv.includes('--' + k);
const fail = (m) => { console.error('render: ' + m); process.exit(1); };
for (const k of ['root', 'page', 'out']) if (!opt(k)) fail(`missing --${k}`);

const mounts = all('mount').map((m) => { const i = m.indexOf('='); return ['/' + m.slice(0, i).replace(/^\/|\/$/g, '') + '/', path.resolve(m.slice(i + 1))]; });
mounts.push(['/', path.resolve(opt('root'))]);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.wasm': 'application/wasm', '.glsl': 'text/plain; charset=utf-8', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const [prefix, dir] = mounts.find(([p]) => url.startsWith(p));
  const file = path.join(dir, url.slice(prefix.length));
  if (file !== dir && !file.startsWith(dir + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' }); res.end(body);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

let chromium; const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const dir of [KIT, process.cwd()]) { try { ({ chromium } = createRequire(path.join(dir, 'package.json'))('playwright')); break; } catch {} }
if (!chromium) fail(`playwright is not installed. Run  npm install  in ${KIT}`);
const exe = [process.env.TIRAZ_CHROMIUM, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && fs.existsSync(p));
const [width, height] = opt('size', '1080x1920').split('x').map(Number);
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${new URL(r.url()).pathname}`); });   // a missing file is named, not just counted
const sep = opt('page').includes('?') ? '&' : '?';
const wantBoxes = flag('boxes'), boxes = {};                 // --boxes: the page records the text boxes of each frame, and they are written to boxes.json beside the pictures
const res = await page.goto(`http://127.0.0.1:${server.address().port}/${opt('page').replace(/^\//, '')}${sep}size=${width}x${height}${wantBoxes ? '&debug=1' : ''}`).catch(() => null);
if (!res || !res.ok()) { await browser.close(); server.close(); fail('the page was not found under --root: ' + opt('page')); }
// A page that throws while it loads never becomes ready: stop as soon as it reports an error, instead of waiting out the whole minute.
let ready = false;
for (const started = Date.now(); Date.now() - started < 60000;) {
  ready = await page.evaluate(() => !!(window.stage && window.stage.ready === true)).catch(() => false);
  if (ready) break;
  if (errors.length) { await new Promise((r) => setTimeout(r, 300)); break; }     // a moment for the rest of its errors to arrive
  await new Promise((r) => setTimeout(r, 100));
}
if (!ready) { await browser.close(); server.close(); fail('the page never became ready.\n  ' + ([...new Set(errors)].join('\n  ') || 'no error was printed by the page')); }

const out = path.resolve(opt('out')); fs.mkdirSync(out, { recursive: true });
const end = await page.evaluate(() => window.stage.end), fps = Number(opt('fps', 60)), png = flag('png');
const shot = async (t, name) => {
  try { await page.evaluate((t) => window.stage.frame(t), t); }
  catch (e) {                                                  // a scene that throws while drawing: say when and what, not a stack of the renderer
    const lines = String(e.message || e).split('\n').map((l) => l.trim()).filter(Boolean);
    const where = lines.filter((l) => l.startsWith('at ')).slice(0, 3).map((l) => l.replace(/https?:\/\/127\.0\.0\.1:\d+/g, '')).join('\n    ');
    await browser.close(); server.close();
    fail(`the scene failed while drawing the moment ${t.toFixed(3)} s:\n  ${lines[0].replace(/^page\.evaluate:\s*/, '')}${where ? '\n    ' + where : ''}`);
  }
  await page.screenshot(png ? { path: path.join(out, name + '.png') } : { path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 94 });
  if (wantBoxes) boxes[name] = { t, ...(await page.evaluate(() => window.__scene || { boxes: [], strings: {} })) };
};
const t0 = Date.now(); let n = 0;
if (opt('at')) for (const t of opt('at').split(',').map(Number)) { await shot(t, 'at_' + t.toFixed(2).padStart(6, '0')); n++; }
else for (let f = Math.round(Number(opt('from', 0)) * fps); f < Math.round(Number(opt('to', end)) * fps); f++) { await shot(f / fps, String(f).padStart(5, '0')); n++; }
await browser.close(); server.close();
if (wantBoxes) fs.writeFileSync(path.join(out, 'boxes.json'), JSON.stringify(boxes));
if (errors.length) fail('the page reported errors while drawing:\n  ' + [...new Set(errors)].join('\n  '));
console.log(`${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s → ${out}`);
