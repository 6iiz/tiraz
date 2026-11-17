// still.mjs · node web/still.mjs <site folder> <out.png|.webp|.jpg> [--width 1440] [--height 900] [--ratio 2] [--t <number>] [--n <index>] [--page <path>] [--screen]
// Saves one frame of a scene as a picture, to use as that scene's still: what a visitor sees with JavaScript off, without WebGL, and
// until the scene has loaded (guides/web.md section 11). The scene must be mounted through web/kit/stage.js (createStage for
// three.js, createDrawing for a 2D canvas), which draws the frame when the page is opened with ?still=1. The picture has the scene's
// own transparency, at the size its box has in a window of --width x --height, times --ratio (2 by default, for sharp screens).
//   --t <number>    the moment to picture, when it is not the scene's own resting moment (the `rest` given to the stage): seconds
//                   for a scene that runs on the clock; for a scene that follows the scroll, whatever number its own code reads
//                   from stage.rest as its place in the story (a beat, or 0 to 1)
//   --screen        picture the scene's box as the page shows it, with the words the page lays over the scene and the ground
//                   behind it, in place of the canvas alone (no transparency: this is a picture of that part of the screen)
//   --n <index>     which scene, on a page with several (0 is the first one mounted)
//   --page <path>   a page other than index.html, relative to the site folder
// The folder is served on 127.0.0.1 and every request to another host is refused, as in web/check.mjs. Exit code 1 with a sentence
// when no scene answered.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';   // resolved from kit/node_modules

const args = process.argv.slice(2);
const flags = new Set(['--width', '--height', '--ratio', '--t', '--n', '--page']);
const plain = args.filter((a, i) => !a.startsWith('--') && !flags.has(args[i - 1]));
const screen = args.includes('--screen');
const opt = (name, d) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : d; };
const [site, outFile] = plain;
const stop = (m) => { console.error(m); process.exit(1); };
if (!site || !outFile || !fs.existsSync(site)) stop('Give the site folder and the picture to write: node web/still.mjs <site folder> <out.png|.webp|.jpg> [--width 1440] [--height 900] [--ratio 2] [--t <number>] [--n <index>] [--page <path>] [--screen]');
const type = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[path.extname(outFile).toLowerCase()];
if (!type) stop('The picture must end in .png, .webp or .jpg (a .jpg has no transparency: the scene is then pictured on black).');
const W = Number(opt('width', 1440)), H = Number(opt('height', 900)), ratio = Number(opt('ratio', 2)), n = Number(opt('n', 0)), page_ = String(opt('page', '')).replace(/^[\\/]+/, '');

const root = path.resolve(site);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const exe = [process.env.TIRAZ_CHROMIUM, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let code = 0;
try {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: ratio });
  await ctx.route('**/*', (route) => { const u = new URL(route.request().url()); return /^(https?|wss?):$/.test(u.protocol) && u.origin !== origin ? route.abort('blockedbyclient') : route.continue(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const t = opt('t', null);
  await page.goto(`${origin}/${page_}?still=1${t === null ? '' : '&t=' + encodeURIComponent(t)}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const ready = await page.waitForFunction((i) => window.__tirazStages && window.__tirazStages[i] && window.__tirazStages[i].ready, n, { timeout: 20000 }).then(() => true, () => false);
  if (!ready) {
    const found = await page.evaluate(() => (window.__tirazStages || []).length);
    console.error(found ? `The page mounted ${found} scene(s) through kit/stage.js, but scene ${n} never drew a frame.` + (errors.length ? ' The page reported: ' + errors.slice(0, 2).join(' | ') : '')
      : 'No scene on this page was mounted through kit/stage.js (or the browser refused WebGL), so there is no frame to picture.' + (errors.length ? ' The page reported: ' + errors.slice(0, 2).join(' | ') : ''));
    code = 1;
  } else {
    let data = await page.evaluate(([i, ty]) => window.__tirazStages[i].picture(ty, 0.92), [n, type]);
    let cut = null;
    if (screen) {
      // the box as the page shows it: the window is pictured whole (a clipped picture lands in the wrong place on a right-to-left page
      // that scrolls sideways) and the box is cut out of it inside the page
      const box = await page.evaluate((i) => { const b = window.__tirazStages[i].box; b.scrollIntoView({ block: 'center', inline: 'center' }); const r = b.getBoundingClientRect();
        return { x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(innerWidth, r.right) - Math.max(0, r.left), h: Math.min(innerHeight, r.bottom) - Math.max(0, r.top), whole: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5 }; }, n);
      await page.waitForTimeout(300);
      const cdp = await ctx.newCDPSession(page), shot = (await cdp.send('Page.captureScreenshot', { format: 'png' })).data;
      data = await page.evaluate(async ([png, b, k, ty]) => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + png)).blob()); const c = document.createElement('canvas');
        c.width = Math.round(b.w * k); c.height = Math.round(b.h * k); c.getContext('2d').drawImage(im, Math.round(b.x * k), Math.round(b.y * k), c.width, c.height, 0, 0, c.width, c.height); return c.toDataURL(ty, 0.92); }, [shot, box, ratio, type]);
      cut = box;
      if (!box.whole) console.error(`note: the scene's box is larger than a ${W}x${H} window, so only the part of it that fits was pictured.`);
    }
    const bytes = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true }); fs.writeFileSync(outFile, bytes);
    const size = await page.evaluate((i) => { const b = window.__tirazStages[i].box, r = b.getBoundingClientRect(), c = b.querySelector('canvas'); return { box: [Math.round(r.width), Math.round(r.height)], pixels: c ? [c.width, c.height] : null }; }, n);
    console.log(JSON.stringify({ still: path.resolve(outFile), bytes: bytes.length, ...size, window: [W, H], ...(cut ? { screen: [Math.round(cut.w), Math.round(cut.h)] } : {}) }));
  }
} finally { await browser.close(); server.close(); }
process.exit(code);
