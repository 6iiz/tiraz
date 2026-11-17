// test_kit.mjs · node web/test_kit.mjs
// Proves the page mechanics in web/kit/ (stage.js for a three.js scene and for a 2D drawing, scroll.js for what answers the scroll and the hand) and
// web/still.mjs, on one small page it builds in a temporary folder: with JavaScript on, under reduced motion, with JavaScript off,
// and through the site check. One line per check; exit code 1 when any failed. The page is plain on purpose: it is a test page.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import zlib from 'node:zlib'; import http from 'node:http';
import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT = path.join(KIT, 'assets', 'fonts', 'Cairo', 'Cairo[slnt,wght].ttf');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tiraz-kit-'));
let failed = 0, passed = 0;
const check = (what, ok, why = '') => { if (ok) passed++; else failed++; console.log((ok ? 'ok    ' : 'FAIL  ') + what + (ok || !why ? '' : ': ' + why)); };

function png(file, w, h, rgb) {                    // a small flat picture written by hand, to stand as the scene's still
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
  const head = Buffer.alloc(13); head.writeUInt32BE(w, 0); head.writeUInt32BE(h, 4); head[8] = 8; head[9] = 2;
  const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) row[1 + x * 3 + k] = rgb[k];
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(Buffer.concat(Array(h).fill(row)))), chunk('IEND', Buffer.alloc(0))]));
}

const PAGE = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>صفحة اختبار المشهد</title>
<link rel="icon" href="data:,">
<style>
  @font-face { font-family: "TestFace"; src: url("fonts/face.ttf") format("truetype"); font-weight: 200 1000; }
  html { background: #ffffff; color: #1a1a1a; font-family: "TestFace", sans-serif; line-height: 1.7; }
  body { margin: 0; }
  main { max-width: 40rem; margin-inline: auto; padding-inline: 1rem; }
  .scene { position: relative; height: 22rem; background: #20242c; }
  .scene img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .drawing { position: relative; height: 10rem; background: #f4f4f4; }
  .drawing img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .multi, .slow { position: relative; height: 2rem; background: #f4f4f4; }
  .multi img { position: absolute; inset-block: 0; inset-inline-start: 0; width: 50%; height: 100%; object-fit: cover; display: block; }
  .multi img + img { inset-inline-start: 50%; }
  section { min-height: 110vh; padding-block: 2rem; }
  section.hold { min-height: 240vh; padding-block: 0; }
  .pin { position: sticky; top: 0; height: 100vh; display: grid; align-content: end; }
  html.js .rise:not(.seen) { opacity: 0; }
  .card { width: 12rem; max-width: 100%; height: 7rem; background: #eeeeee; transform: perspective(900px) rotateX(var(--lean-x, 0deg)) rotateY(var(--lean-y, 0deg)); }
  .far { transform: translate3d(0, var(--shift, 0px), 0); }
</style>
</head>
<body>
<main>
  <h1>صفحة اختبار المشهد</h1>
  <p id="n0">نخدم 12 مدينة منذ 2019.</p>
  <div class="scene"><img src="still.png" alt="" width="64" height="64"></div>
  <div class="drawing"><img src="still.png" alt="" width="64" height="64"></div>
  <div class="multi"><img src="still.png" alt="" width="64" height="64"><img src="still.png" alt="" width="64" height="64"></div>
  <div class="slow"></div>
  <section id="one" data-state="one">
    <p class="rise">هذه فقرة أولى تظهر عند الوصول إليها، وهي مكتوبة لتكون الصفحة أطول من مئتي حرف حتى لا يشتكي الفاحص من قلة النص، فالغاية هنا اختبار الآليات وحدها.</p>
    <p id="n">جمّعنا 1,240 جهازاً منذ 2019.</p>
    <div class="card" id="card"></div>
    <p class="far" data-depth="0.3" id="far">طبقة أبعد تتحرك أبطأ من الصفحة.</p>
  </section>
  <section id="two" data-state="two">
    <p class="rise" id="late">هذه فقرة ثانية في قسم ثانٍ، تظهر عند الوصول إليها.</p>
    <p id="n2">وصلنا 2,500 طلب حتى اليوم.</p>
    <p class="rise" id="last">وهذه فقرة أخيرة فيها رابط: <a href="#one" id="jump">عودة إلى القسم الأول</a>.</p>
  </section>
  <section class="hold">
    <div class="pin"><p class="rise" id="foot">سطر في أسفل شاشة تبقى في النافذة ما دام قسمها يمرّ.</p></div>
  </section>
</main>
<script type="module">
  import * as THREE from './vendor/three/three.module.min.js';
  import { createStage, createDrawing, studio, softShadow } from './kit/stage.js';
  import { seen, sectionState, count, depth, lean, progress, pinned, pointer, range, damp } from './kit/scroll.js';
  const stage = createStage(THREE, { box: document.querySelector('.scene'), still: document.querySelector('.scene img'), rest: 1 });
  if (stage) {
    stage.camera.position.set(0, 1.4, 5); stage.camera.lookAt(0, 0.6, 0);
    stage.scene.environment = studio(THREE, stage.renderer, [{ position: [0, 4, 2], size: [4, 4], color: '#ffffff', intensity: 4 }]);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 16), new THREE.MeshStandardMaterial({ color: '#c8552b', roughness: 0.4 }));
    ball.position.y = 0.8; const shade = softShadow(THREE, { opacity: 0.5 }); shade.scale.set(2.4, 1, 2.4);
    stage.scene.add(ball, shade);
    stage.run(({ t }) => { ball.position.x = Math.sin(t * 3) * 1.4; shade.position.x = ball.position.x; });
  }
  const drawing = createDrawing({ box: document.querySelector('.drawing'), still: document.querySelector('.drawing img'), rest: 1 });
  if (drawing) drawing.run(({ t, ctx, stage }) => { ctx.fillStyle = '#c8552b'; ctx.fillRect((Math.sin(t * 3) * 0.4 + 0.5) * (stage.width - 40), 20, 40, 40); return true; });
  // a scene with a still for each of two moments, and one that asks for a frame only every tenth of a second
  const multi = createDrawing({ box: document.querySelector('.multi'), still: document.querySelectorAll('.multi img') });
  if (multi) multi.run(({ ctx, stage }) => { ctx.fillStyle = '#20242c'; ctx.fillRect(0, 0, stage.width, stage.height); return false; });
  const slow = createDrawing({ box: document.querySelector('.slow') });
  if (slow) slow.run(() => { window.__slow = (window.__slow || 0) + 1; return 0.1; });
  // the soft shadow alone, seen from straight above: how opaque it is at the middle, three quarters of the way out and near the edge,
  // along its width and along its depth
  window.__shade = () => {
    const r = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(120, 120, false);
    const sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 10); cam.position.set(0, 5, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
    const m = softShadow(THREE, { color: '#000000', opacity: 1, hardness: 0.25 }); m.scale.set(2, 1, 2); sc.add(m); r.render(sc, cam);
    const gl = r.getContext(), a = (x, y) => { const d = new Uint8Array(4); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, d); return d[3]; };
    const out = { mid: a(60, 60), x75: a(90, 60), z75: a(60, 90), xEdge: a(97, 60), zEdge: a(60, 97), beyond: a(108, 60) };
    r.dispose(); return out;
  };
  // how often the text of each counted number changes: one that is already in front of the visitor must not change at all
  window.__changes = { n0: 0, n2: 0 };
  for (const id of ['n0', 'n2']) new MutationObserver(() => window.__changes[id]++).observe(document.getElementById(id), { childList: true, characterData: true, subtree: true });
  window.__hand = pointer();
  seen('.rise'); sectionState('section'); for (const id of ['n0', 'n', 'n2']) count(document.getElementById(id)); depth(); lean(document.getElementById('card'));
  window.__kit = { stage: !!stage, drawing: !!drawing, multi: !!multi, ratio: drawing ? drawing.ratio : 0, banded: progress(document.getElementById('one'), { top: 100, bottom: 50 }), progress: progress(document.getElementById('one')), pinned: pinned(document.getElementById('one')), range: range(5, 0, 10), damp: damp(0, 1, 100, 1) };
</script>
</body>
</html>
`;

const dir = path.join(tmp, 'site');
for (const d of ['fonts', 'kit', path.join('vendor', 'three')]) fs.mkdirSync(path.join(dir, d), { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), PAGE); png(path.join(dir, 'still.png'), 64, 64, [32, 36, 44]);
fs.copyFileSync(FONT, path.join(dir, 'fonts', 'face.ttf'));
for (const f of ['stage.js', 'scroll.js']) fs.copyFileSync(path.join(KIT, 'web', 'kit', f), path.join(dir, 'kit', f));
for (const f of ['three.module.min.js', 'LICENSE']) fs.copyFileSync(path.join(KIT, 'vendor', 'three', f), path.join(dir, 'vendor', 'three', f));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dir, p);
  if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}/`;
const exe = [process.env.TIRAZ_CHROMIUM, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const boxOf = (page, sel) => page.evaluate((q) => { const r = document.querySelector(q).getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }; }, sel);
const drawingBox = (page) => boxOf(page, '.drawing');
const sceneBox = (page) => page.evaluate(() => { const r = document.querySelector('.scene').getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }; });

try {
  { // JavaScript on: the scene is live, its still has given way, and the helpers do what they say
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const s = await page.evaluate(() => { const box = document.querySelector('.scene'), img = box.querySelector('img'), c = box.querySelector('canvas');
      const dbox = document.querySelector('.drawing');
      return { kit: window.__kit, live: box.classList.contains('live'), still: getComputedStyle(img).display, canvas: c ? [c.width, c.height] : null, hidden: c ? c.getAttribute('aria-hidden') : null, stages: (window.__tirazStages || []).length, js: document.documentElement.classList.contains('js'),
        drawing: { live: dbox.classList.contains('live'), still: getComputedStyle(dbox.querySelector('img')).display, canvas: !!dbox.querySelector('canvas') } }; });
    check('the page runs without errors', errors.length === 0, errors.join(' | '));
    check('stage: the scene is mounted and live, and its still has given way', s.kit && s.kit.stage && s.live && s.still === 'none' && s.canvas && s.canvas[0] > 0 && s.stages === 4, JSON.stringify(s));
    const extra = await page.evaluate(() => ({ live: document.querySelector('.multi').classList.contains('live'), stills: [...document.querySelectorAll('.multi img')].map((i) => getComputedStyle(i).display), slow: window.__slow || 0, shade: window.__shade() }));
    check('stage: a scene given a still for each of its moments lets all of them give way', s.kit && s.kit.multi && extra.live && extra.stills.length === 2 && extra.stills.every((d) => d === 'none'), JSON.stringify(extra));
    check('stage: a scene that returns a number is drawn again only after that many seconds', extra.slow >= 4 && extra.slow <= 30, `${extra.slow} frames in about a second and a half, for a wait of a tenth of a second`);
    const sh = extra.shade;
    check('stage: the soft shadow is dark in the middle and fades to nothing at its edge', sh.mid > 235 && sh.x75 > 30 && sh.x75 < 130 && sh.xEdge < sh.x75 && sh.xEdge < 45 && sh.beyond === 0, JSON.stringify(sh));
    check('stage: the soft shadow is as deep as it is wide when scale.x and scale.z are the same', Math.abs(sh.x75 - sh.z75) <= 10 && Math.abs(sh.xEdge - sh.zEdge) <= 10 && sh.z75 > 30, JSON.stringify(sh));
    const refusal = await page.evaluate(async () => { const { createStage } = await import('./kit/stage.js'); const box = document.createElement('div'); document.body.appendChild(box);
      const got = createStage({ WebGLRenderer: function () { throw new Error('refused'); } }, { box }); const told = { stage: got, box: box.classList.contains('no-scene'), page: document.documentElement.classList.contains('no-scene') };
      box.remove(); document.documentElement.classList.remove('no-scene'); return told; });
    check('stage: a scene the browser refuses returns nothing and marks its box and the page', refusal.stage === null && refusal.box && refusal.page, JSON.stringify(refusal));
    check('stage: the canvas is marked as decoration when no label is given', s.hidden === 'true', String(s.hidden));
    const clip = await sceneBox(page), a = await page.screenshot({ clip }); await page.waitForTimeout(400); const b = await page.screenshot({ clip });
    check('stage: the scene moves from one moment to the next', Buffer.compare(a, b) !== 0);
    check('stage: a 2D drawing is mounted the same way, live, with its still given way', !!(s.kit && s.kit.drawing && s.kit.ratio >= 1 && s.drawing.live && s.drawing.still === 'none' && s.drawing.canvas), JSON.stringify(s.drawing));
    const dclip = await drawingBox(page), da = await page.screenshot({ clip: dclip }); await page.waitForTimeout(400); const db = await page.screenshot({ clip: dclip });
    check('stage: the drawing moves while its function returns true', Buffer.compare(da, db) !== 0);
    const hand = await page.evaluate(() => { const h = window.__hand, fire = (type, o) => window.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: 200, clientY: 200, ...o }));
      fire('pointermove', { pointerType: 'touch' }); const touching = { type: h.type, active: h.active }; fire('pointerdown', { pointerType: 'touch' }); const down = h.down;
      fire('pointermove', { pointerType: 'touch', clientX: 520 }); const dragged = h.x - h.startX; fire('pointerup', { pointerType: 'touch', clientX: 520 });
      const lifted = { active: h.active, down: h.down }; fire('pointermove', { pointerType: 'mouse' }); return { touching, down, dragged, across: 320 / innerWidth * 2, lifted, mouse: { type: h.type, active: h.active } }; });
    check('scroll: the pointer knows a finger from a mouse and lets go when the finger lifts', hand.touching.type === 'touch' && hand.touching.active && hand.down && !hand.lifted.active && !hand.lifted.down && hand.mouse.type === 'mouse' && hand.mouse.active, JSON.stringify(hand));
    check('scroll: the pointer says how far a drag has gone from where the press began', Math.abs(hand.dragged - hand.across) < 0.01, JSON.stringify(hand));
    const focused = await page.evaluate(() => { const last = document.getElementById('last'), was = last.classList.contains('seen'); document.getElementById('jump').focus({ preventScroll: true }); return { was, now: last.classList.contains('seen') }; });
    check('scroll: an element that takes the focus before it was seen is finished at once', !focused.was && focused.now, JSON.stringify(focused));
    check('scroll: range and damp return what they describe', s.kit && s.kit.range === 0.5 && s.kit.damp > 0.99 && s.kit.progress >= 0 && s.kit.progress <= 1 && s.kit.banded >= 0 && s.kit.banded <= 1 && s.kit.banded !== s.kit.progress && s.kit.pinned === 0, JSON.stringify(s.kit));
    await page.waitForTimeout(1200);
    const first = await page.evaluate(() => ({ text: document.getElementById('n0').textContent, changes: window.__changes.n0, later: window.__changes.n2, n: document.getElementById('n').textContent }));
    check('scroll: a number already in front of the visitor stays as written, and one further down waits', first.text === 'نخدم 12 مدينة منذ 2019.' && first.changes === 0 && first.later === 0, JSON.stringify(first));
    check('scroll: a counted number ends on the text exactly as written', first.n === 'جمّعنا 1,240 جهازاً منذ 2019.', first.n);
    await page.evaluate(() => document.getElementById('n').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(400);   // the first section is now across the middle of the window
    const before = await page.evaluate(() => ({ late: document.getElementById('late').classList.contains('seen'), foot: document.getElementById('foot').classList.contains('seen'), state: document.documentElement.dataset.state || '' }));
    await page.evaluate(() => document.getElementById('late').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ late: document.getElementById('late').classList.contains('seen'), state: document.documentElement.dataset.state || '', shift: document.getElementById('far').style.getPropertyValue('--shift') }));
    check('scroll: an element is marked as seen only when the visitor reaches it', s.js && !before.late && after.late, JSON.stringify({ before, after }));
    await page.waitForTimeout(1100);
    const counted = await page.evaluate(() => ({ text: document.getElementById('n2').textContent, changes: window.__changes.n2 }));
    check('scroll: a number reached by scrolling counts up and ends on the text exactly as written', counted.text === 'وصلنا 2,500 طلب حتى اليوم.' && counted.changes > 3, JSON.stringify(counted));
    await page.evaluate(() => { const hold = document.querySelector('.hold'); window.scrollTo({ top: Math.round(hold.getBoundingClientRect().top + scrollY) + 40, behavior: 'instant' }); }); await page.waitForTimeout(500);
    const held = await page.evaluate(() => { const foot = document.getElementById('foot'), r = foot.getBoundingClientRect(); return { seen: foot.classList.contains('seen'), top: Math.round(r.top), line: Math.round(innerHeight * 0.88), pinTop: Math.round(document.querySelector('.pin').getBoundingClientRect().top) }; });
    check('scroll: an element low on a screen that stays is seen while the screen holds, though it never crosses the line', !before.foot && held.seen && held.pinTop === 0 && held.top > held.line, JSON.stringify({ before: before.foot, held }));
    check('scroll: the state of the page follows the section in the middle of the window', before.state === 'one' && after.state === 'two', JSON.stringify({ before: before.state, after: after.state }));
    check('scroll: a far layer is given its shift', /px$/.test(after.shift) && parseFloat(after.shift) !== 0, after.shift);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(200);
    const card = await page.evaluate(() => { const e = document.getElementById('card'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.move(card.x + card.w * 0.5, card.y + card.h * 0.5); await page.mouse.move(card.x + card.w * 0.9, card.y + card.h * 0.5, { steps: 4 }); await page.waitForTimeout(500);
    const lean = await page.evaluate(() => document.getElementById('card').style.getPropertyValue('--lean-y'));
    check('scroll: a card leans toward the pointer', /deg$/.test(lean) && Math.abs(parseFloat(lean)) > 0.5, lean);
    await ctx.close();
  }
  { // reduced motion: one frame and no loop, nothing waits to appear, nothing counts
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }); const page = await ctx.newPage();
    await page.goto(origin, { waitUntil: 'load' }); await page.waitForTimeout(1200);
    const clip = await sceneBox(page), a = await page.screenshot({ clip }); await page.waitForTimeout(700); const b = await page.screenshot({ clip });
    const s = await page.evaluate(() => ({ live: document.querySelector('.scene').classList.contains('live'), seen: [...document.querySelectorAll('.rise')].every((e) => e.classList.contains('seen')), n: document.getElementById('n').textContent, shift: document.getElementById('far').style.getPropertyValue('--shift') }));
    check('reduced motion: the scene draws its one frame and stands still', s.live && Buffer.compare(a, b) === 0);
    const dclip = await drawingBox(page), da = await page.screenshot({ clip: dclip }); await page.waitForTimeout(500); const db = await page.screenshot({ clip: dclip });
    check('reduced motion: the drawing draws its one frame and stands still', (await page.evaluate(() => document.querySelector('.drawing').classList.contains('live'))) && Buffer.compare(da, db) === 0);
    check('reduced motion: nothing waits to appear, counts or drifts', s.seen && s.n === 'جمّعنا 1,240 جهازاً منذ 2019.' && s.shift === '', JSON.stringify(s));
    await ctx.close();
  }
  { // the script arrived after the page was left to stand as written (window.pageIsPlain): no scene mounts over it and nothing is hidden again
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.addInitScript(() => { window.pageIsPlain = true; }); const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin, { waitUntil: 'load' }); await page.waitForTimeout(900);
    const s = await page.evaluate(() => ({ kit: window.__kit, canvases: document.querySelectorAll('canvas').length, still: getComputedStyle(document.querySelector('.scene img')).display, js: document.documentElement.classList.contains('js'),
      seen: [...document.querySelectorAll('.rise')].every((e) => e.classList.contains('seen')), opacity: getComputedStyle(document.getElementById('late')).opacity, changes: window.__changes }));
    check('a late script on a page left to stand as written: no scene is mounted and the stills stay', errors.length === 0 && s.kit && !s.kit.stage && !s.kit.drawing && s.canvases === 0 && s.still !== 'none', JSON.stringify(s) + errors.join(' | '));
    check('a late script on a page left to stand as written: nothing is hidden again and nothing counts', !s.js && s.seen && s.opacity === '1' && s.changes.n0 === 0 && s.changes.n2 === 0, JSON.stringify(s));
    await ctx.close();
  }
  { // JavaScript off: the still is what the visitor sees
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false }); const page = await ctx.newPage();
    await page.goto(origin, { waitUntil: 'load' }); await page.waitForTimeout(300);
    const s = await page.evaluate(() => { const box = document.querySelector('.scene'), img = box.querySelector('img'); return { still: getComputedStyle(img).display, loaded: img.naturalWidth, canvas: !!box.querySelector('canvas'), rise: getComputedStyle(document.querySelector('.rise')).opacity }; });
    check('JavaScript off: the still stands in the scene\'s place and no text is hidden', s.still !== 'none' && s.loaded > 0 && !s.canvas && s.rise === '1', JSON.stringify(s));
    await ctx.close();
  }
  { // the still, pictured from the scene itself
    const out = path.join(tmp, 'made-still.png');
    const r = spawnSync(process.execPath, [path.join(KIT, 'web', 'still.mjs'), dir, out, '--width', '1280', '--height', '800', '--ratio', '1'], { encoding: 'utf8' });
    let info = null; try { info = JSON.parse(r.stdout.trim().split('\n').pop()); } catch {}
    check('still.mjs: writes one frame of the scene as a picture', r.status === 0 && fs.existsSync(out) && fs.statSync(out).size > 500 && !!info, (r.stdout + r.stderr).slice(-300));
    if (fs.existsSync(out)) {
      const page = await browser.newPage();
      const px = await page.evaluate(async (src) => { const img = new Image(); img.src = src; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data; let clear = 0, solid = 0; for (let i = 3; i < d.length; i += 4) { if (d[i] === 0) clear++; else if (d[i] === 255) solid++; } return { w: c.width, h: c.height, clear, solid }; }, 'data:image/png;base64,' + fs.readFileSync(out).toString('base64'));
      check('still.mjs: the picture keeps the scene\'s transparency and holds the object', px.clear > 1000 && px.solid > 1000, JSON.stringify(px));
      await page.close();
    }
    const out2 = path.join(tmp, 'made-drawing.png');
    const r2 = spawnSync(process.execPath, [path.join(KIT, 'web', 'still.mjs'), dir, out2, '--width', '1280', '--height', '800', '--ratio', '1', '--n', '1'], { encoding: 'utf8' });
    check('still.mjs: pictures the second scene, a 2D drawing, when asked for it', r2.status === 0 && fs.existsSync(out2) && fs.statSync(out2).size > 200, (r2.stdout + r2.stderr).slice(-300));
    const out3 = path.join(tmp, 'made-screen.png');
    const r3 = spawnSync(process.execPath, [path.join(KIT, 'web', 'still.mjs'), dir, out3, '--width', '1280', '--height', '800', '--ratio', '1', '--screen'], { encoding: 'utf8' });
    let info3 = null; try { info3 = JSON.parse(r3.stdout.trim().split('\n').pop()); } catch {}
    check('still.mjs --screen: pictures the scene\'s box as the page shows it, at the size of the box', r3.status === 0 && fs.existsSync(out3) && !!info3 && !!info3.screen && info3.screen[0] === info3.box[0] && info3.screen[1] === info3.box[1], (r3.stdout + r3.stderr).slice(-300));
    if (fs.existsSync(out3)) {
      const page = await browser.newPage();
      const px = await page.evaluate(async (src) => { const img = new Image(); img.src = src; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data; let clear = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 255) clear++; return { w: c.width, h: c.height, clear, corner: [d[0], d[1], d[2]] }; }, 'data:image/png;base64,' + fs.readFileSync(out3).toString('base64'));
      check('still.mjs --screen: the picture holds the ground behind the scene, with no transparency', px.clear === 0 && px.corner[0] === 32 && px.corner[1] === 36 && px.corner[2] === 44, JSON.stringify(px));
      await page.close();
    }
    const none = spawnSync(process.execPath, [path.join(KIT, 'web', 'still.mjs'), path.join(KIT, 'tools', 'fixtures'), path.join(tmp, 'none.png')], { encoding: 'utf8' });
    check('still.mjs: a page with no scene is answered with a sentence, not a picture', none.status === 1 && !fs.existsSync(path.join(tmp, 'none.png')) && /No scene|Give the site folder/.test(none.stderr), none.stderr.slice(-200));
  }
  { // through the site check: nothing to report, the canvas is seen standing still, and the page is pictured screen by screen
    const out = dir + '.check';
    const r = spawnSync(process.execPath, [path.join(KIT, 'web', 'check.mjs'), dir, '--out', out, '--more'], { encoding: 'utf8' });
    let json = null; try { json = JSON.parse(fs.readFileSync(path.join(out, 'check.json'), 'utf8')); } catch {}
    check('the site check passes the page', r.status === 0 && json && json.problems.length === 0, json ? json.problems.join(' | ') : (r.stdout + r.stderr).slice(-300));
    check('the site check sees the scene standing still under reduced motion', !!(json && json.reducedMotion.canvases.seen === 2 && json.reducedMotion.canvases.moving === 0), JSON.stringify(json && json.reducedMotion));
    const shots = json && json.more && json.more.scroll ? json.more.scroll : {};
    check('the site check pictures the page screen by screen, on a desktop and on a phone', ['desktop', 'phone'].every((k) => shots[k] && shots[k].shots.length >= 2 && shots[k].shots.every((s) => fs.existsSync(path.join(out, s.file)))), JSON.stringify(shots).slice(0, 300));
  }
} finally {
  await browser.close(); server.close();
  if (process.env.TIRAZ_KEEP_TEST) console.log('kept for a look: ' + tmp); else fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${passed} checks passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
