// test_check.mjs · node web/test_check.mjs
// Proves the site checker on two small pages it builds in a temporary folder: one made right, which must pass with nothing to report,
// and one with a fault of every kind the checker claims to catch, where each fault must be named. One line per check; exit code 1 when
// any failed. The pages are plain on purpose: they are test pages, not designs. Needs the kit's Playwright (npm install) and Chrome.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT = path.join(KIT, 'assets', 'fonts', 'Cairo', 'Cairo[slnt,wght].ttf');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tiraz-sitecheck-'));
let failed = 0, passed = 0;
const check = (what, ok, why = '') => { if (ok) passed++; else failed++; console.log((ok ? 'ok    ' : 'FAIL  ') + what + (ok || !why ? '' : ': ' + why)); };

// a small dark picture, written without any image library: an uncompressed-looking PNG made by hand (one colour per row, top to bottom)
function png(file, w, h, top, bottom) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
  const head = Buffer.alloc(13); head.writeUInt32BE(w, 0); head.writeUInt32BE(h, 4); head[8] = 8; head[9] = 2;      // 8 bits, RGB
  const rows = [];
  for (let y = 0; y < h; y++) { const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) row[1 + x * 3 + k] = Math.round(top[k] + (bottom[k] - top[k]) * y / (h - 1)); rows.push(row); }
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]));
}

const STYLE = `
  @font-face { font-family: "TestFace"; src: url("fonts/face.ttf") format("truetype"); font-weight: 200 1000; }
  html { background: #ffffff; color: #1a1a1a; font-family: "TestFace", sans-serif; line-height: 1.7; }
  body { margin: 0; }
  main { max-width: 40rem; margin-inline: auto; padding-inline: 1rem; }
  .over { position: relative; margin-block: 1rem; }
  .over img { display: block; width: 100%; height: 16rem; object-fit: cover; }
  .over h1 { margin: 0; font-size: 2rem; line-height: 1.4; }`;
const page = (title, style, body) => `<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title}</title>\n<link rel="icon" href="data:,">\n${style}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

const GOOD = page('صفحة تجربة سليمة', `<style>${STYLE}
  .over .words { position: absolute; inset-block-end: 1rem; inset-inline-start: 1rem; color: #ffffff; }
  .go { display: inline-block; padding: 0.9rem 2.6rem; border: 4px solid #1a1a1a; border-radius: 999px; background: #f2c14e; color: #1a1a1a; font: inherit; font-weight: 700; text-decoration: none; }
  .go:hover { background: #ffd978; }
  .go:focus-visible { outline: 3px solid #1a1a1a; outline-offset: 4px; }
  .tall { height: 240vh; }
  .plate { position: sticky; top: 0; height: 100vh; }
  .plate img { position: absolute; inset-inline: 0; bottom: 0; width: 100%; height: 50%; object-fit: cover; }
  .plate .note { position: absolute; inset-inline: 1rem; bottom: 1rem; margin: 0; color: #ffffff; }
</style>`, `<main>
  <section class="over">
    <img src="pic.png" alt="خلفية داكنة" width="64" height="64">
    <div class="words" data-over-picture>
      <h1>صفحة تجربة للفاحص</h1>
      <p>سطر قصير فوق صورة، فيه رقم 250 كم و Latin.</p>
    </div>
  </section>
  <h2>قسم بنص عادي</h2>
  <p>هذا نص على أرضية بيضاء بلون داكن، ليقيس الفاحص التباين من الألوان. السعر 9.99 ر.س، والخصم 15% لمدة 3 أيام. هذه الجملة موجودة لتكون الصفحة أطول من مئتي حرف حتى لا يشتكي الفاحص من قلة النص.</p>
  <p><a class="go" href="#end">زر تجربة</a></p>
  <canvas id="scene" width="240" height="120" style="display:block;background:#eeeeee"></canvas>
  <section class="tall">
    <div class="plate">
      <img src="pic.png" alt="خلفية داكنة تبقى في النافذة" width="64" height="64">
      <p class="note" data-over-picture>سطر أبيض على لوحة تبقى في النافذة، فوق صورتها الداكنة.</p>
    </div>
  </section>
  <p id="end">نهاية الصفحة.</p>
</main>
<script>
  // a drawn scene that respects the visitor: one still frame with reduced motion, a loop otherwise
  const c = document.getElementById('scene').getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw = (t) => { c.clearRect(0, 0, 240, 120); c.fillStyle = '#1a1a1a'; c.fillRect(20 + (still ? 0 : (t / 10) % 180), 40, 40, 40); if (!still) requestAnimationFrame(draw); };
  draw(0);
</script>`);

// every fault here is deliberate, and each has a line in WANT below
const BAD = page('صفحة تجربة سيئة', `<link rel="stylesheet" href="https://fonts.example.invalid/face.css">
<style>${STYLE}
  .over .words { position: absolute; inset-block-start: 1rem; inset-inline-start: 1rem; color: #3a3f45; }
  .over .loose { position: absolute; inset-block-end: 1rem; inset-inline-start: 1rem; margin: 0; color: #ffffff; }
  .wide { width: 600px; background: #eeeeee; }
  .faint { color: #b9b9b9; }
  .reveal { opacity: 0; }
  .reveal.in { opacity: 1; }
  .spin { display: inline-block; animation: spin 2s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .pill { display: inline-block; padding: 0 1px; border: 6px solid #1a1a1a; border-radius: 999px; background: #f2c14e; color: #1a1a1a; font-size: 1.5rem; font-weight: 800; line-height: 1.1; text-decoration: none; outline: none !important; }
  .bar { position: fixed; inset-inline: 0; bottom: 0; height: 5rem; background: #1a1a1a; }
  .tail { height: 130vh; }
  .last { margin: 0; }
  .held { height: 220vh; }
  .held p { margin: 0; padding: 1rem; }
  .stays { position: sticky; top: 15vh; display: block; width: 100%; height: 70vh; object-fit: cover; z-index: -1; }
</style>`, `<main>
  <section class="over">
    <img src="pic.png" alt="">
    <div class="words" data-over-picture>
      <h1>صفحة تجربة سيئة</h1>
    </div>
    <p class="loose">سطر أبيض فوق الصورة بلا علامة.</p>
  </section>
  <div class="wide">صندوق أعرض من شاشة الهاتف.</div>
  <p class="faint">نص رمادي فاتح على أرضية بيضاء.</p>
  <p><a class="pill" href="#none">زر ضيّق على نصّه</a></p>
  <section class="reveal">
    <h2>قسم يظهر فقط بالجافاسكربت</h2>
    <p>هذا نص على أرضية بيضاء بلون داكن. هذه الجملة موجودة لتكون الصفحة أطول من مئتي حرف حتى لا يشتكي الفاحص من قلة النص، فالغاية هنا أن تُلتقط الأخطاء المقصودة وحدها.</p>
    <img src="pic.png" width="120" height="80">
    <p><span class="spin">*</span></p>
  </section>
</main>
<section class="held">
  <img class="stays" src="pic.png" alt="">
  <p>نص داكن يمرّ فوق صورة داكنة تبقى في النافذة ما دام قسمها يمرّ، وليس عليه علامة تقول إنه فوق صورة.</p>
  <p>وسطر ثانٍ يتبعه ليمرّ فوق الصورة نفسها بعده بقليل.</p>
</section>
<canvas id="scene" width="240" height="120" style="display:block;background:#eeeeee"></canvas>
<div class="tail"></div>
<p class="last"><a href="#scene">رابط أخير تحت الشريط</a></p>
<div class="bar"></div>
<script>document.querySelector('.reveal').classList.add('in');
  const c = document.getElementById('scene').getContext('2d');
  const draw = (t) => { c.clearRect(0, 0, 240, 120); c.fillStyle = '#1a1a1a'; c.fillRect(20 + (t / 10) % 180, 40, 40, 40); requestAnimationFrame(draw); };
  requestAnimationFrame(draw);
</script>`);

// what the bad page must be told, as words of the checker's own sentences
const WANT = [
  ['a page wider than the phone', 'scrolls sideways'],
  ['an image with no alt', 'no alt attribute'],
  ['a file asked from another host (refused before it is sent)', 'asked other hosts'],
  ['pale text on the page', 'too little contrast on the page'],
  ['text on a picture without the mark', 'sit on a picture or gradient'],
  ['dark text over a dark picture', 'text over a picture has too little contrast'],
  ['a link to a section that is not there', 'do not resolve'],
  ['text that touches the edge of its pill', 'touches or crosses the rounded edge'],
  ['text hidden until a script runs', 'With JavaScript off'],
  ['a loop that ignores reduced motion', 'still running'],
  ['a drawn scene that ignores reduced motion', 'canvas(es) keep moving'],
  ['a control with no visible keyboard focus', 'Keyboard focus is invisible'],
  ['a link left under a fixed bar at the end of the page', 'lies under div.bar'],
  ['text that passes over a picture that stays in the window, without the mark', 'that stays in the window while the page scrolls'],
  ['dark words over that dark picture as they pass it, found on the walk', 'hard to read against what is really behind'],
];

function build(name, html) {
  const dir = path.join(tmp, name); fs.mkdirSync(path.join(dir, 'fonts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html); fs.copyFileSync(FONT, path.join(dir, 'fonts', 'face.ttf')); png(path.join(dir, 'pic.png'), 64, 64, [18, 22, 30], [40, 46, 58]);
  return dir;
}
function run(dir) {
  const out = dir + '.check';
  const r = spawnSync(process.execPath, [path.join(KIT, 'web', 'check.mjs'), dir, '--out', out, '--more'], { encoding: 'utf8' });
  let json = null; try { json = JSON.parse(fs.readFileSync(path.join(out, 'check.json'), 'utf8')); } catch {}
  return { code: r.status, json, text: (r.stdout || '') + (r.stderr || ''), out };
}

try {
  if (!fs.existsSync(FONT)) { console.log('FAIL  the test font is missing: ' + FONT); process.exit(1); }
  const good = run(build('good', GOOD));
  check('the page made right passes with nothing to report', good.code === 0 && good.json && good.json.problems.length === 0, good.json ? good.json.problems.join(' | ') : good.text.slice(-400));
  check('the page made right: its focus and its hover are seen', !!(good.json && good.json.more && good.json.more.focus.length && good.json.more.focus.every((f) => f.shows) && good.json.more.hover && good.json.more.hover.shows), JSON.stringify(good.json && good.json.more));
  for (const f of ['390x844-top.png', '1440x900-full.png', '390x844-nojs-full.png', 'more-320-full.png', 'more-320-1.png', 'more-1920-top.png', 'more-text200-full.png', 'more-scroll-phone-01.png', 'more-reduced-1.png', 'more-focus-1.png', 'more-hover.png'])
    check(`the page made right: ${f} is written`, fs.existsSync(path.join(good.out, f)));
  check('the page made right: no control is reported as covered', !!(good.json && good.json.more && ['desktop', 'phone'].every((k) => good.json.more.scroll[k] && good.json.more.scroll[k].covered.length === 0)), JSON.stringify(good.json && good.json.more && good.json.more.scroll));
  const plate = good.json ? Object.values(good.json.sizes).map((R) => (R.overPicture || []).find((r) => r.where === 'p.note')) : [];
  check('the page made right: words on a screen that stays are measured where they stand when it has stuck, over its picture', plate.length === 2 && plate.every((r) => r && r.ratio >= 4.5), JSON.stringify(plate));
  check('the page made right: every text was measured against what is behind it on the walk, and none was hard to read', !!(good.json && good.json.more && ['desktop', 'phone'].every((k) => good.json.more.scroll[k] && good.json.more.scroll[k].behind.length === 0) && good.json.more.narrow && good.json.more.narrow.behind.length === 0), JSON.stringify(good.json && good.json.more && good.json.more.scroll && [good.json.more.scroll.desktop.behind, good.json.more.scroll.phone.behind, good.json.more.narrow]));
  check('the page made right: it is told it has no description for search results or link previews, as a note', !!(good.json && good.json.notes.some((n) => n.includes('no description')) && good.json.notes.some((n) => n.includes('no preview'))), JSON.stringify(good.json && good.json.notes));
  check('the page made right: it is told its font would be smaller as WOFF2, as a note', !!(good.json && good.json.notes.some((n) => n.includes('face.ttf') && n.includes('WOFF2'))), JSON.stringify(good.json && good.json.notes));
  const bad = run(build('bad', BAD)), told = bad.json ? bad.json.problems.join('\n') : '';
  check('the faulty page fails', bad.code === 1 && !!bad.json, bad.text.slice(-300));
  for (const [what, words] of WANT) check(`the faulty page: ${what} is named`, told.includes(words), `no problem says "${words}"` + (words.includes('canvas') ? ` (the check saw: ${JSON.stringify(bad.json && bad.json.reducedMotion)})` : ''));
  check('the faulty page: what makes it scroll sideways at 320 px is named', /At 320px wide the page scrolls sideways by \d+px\. Wide things: [^\n]*div\.wide/.test(told), told.split('\n').find((l) => l.startsWith('At 320px')) || 'no such problem');
  const walked = bad.json && bad.json.more && bad.json.more.scroll ? [...bad.json.more.scroll.desktop.behind, ...bad.json.more.scroll.phone.behind] : [];
  check('the faulty page: each place where words were hard to read comes with a picture of it', walked.length > 0 && walked.every((r) => r.file && fs.existsSync(path.join(bad.out, r.file))), JSON.stringify(walked).slice(0, 400));
  check('the faulty page: a last screen that is mostly bare is pointed out, as a note', !!(bad.json && bad.json.notes.some((n) => n.includes('The last screen of the page') && n.includes('is bare'))), JSON.stringify(bad.json && bad.json.notes));
  check('the faulty page: nothing was sent to the other host', !/ERR_NAME_NOT_RESOLVED/.test(told + bad.text), 'the request reached the network stack');
} finally {
  if (process.env.TIRAZ_KEEP_TEST) console.log('kept for a look: ' + tmp);        // set TIRAZ_KEEP_TEST=1 to open the pages and the pictures afterwards
  else fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${passed} checks passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
