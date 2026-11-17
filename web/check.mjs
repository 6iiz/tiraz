// check.mjs · node web/check.mjs <site folder> [--out <folder for screenshots and check.json>] [--draft] [--more] [--shots <n>]
// Serves the site on 127.0.0.1, opens it with the kit's Playwright at 390x844 and 1440x900, and measures what a script can measure.
// It cannot tell you the page looks right: open the screenshots. Exit code 1 when any check fails.
//   --draft   for a page that is not finished (a first screen alone): the rule about too little text is left out
//   --more    also opens the page 320 and 1920 px wide, with the text size doubled, with keyboard focus on its first three controls and
//             with the pointer over its first action, and walks down it on a desktop and on a phone the way a hand scrolls, in small
//             steps, picturing the window screen by screen (more-scroll-*.png, up to 16 pictures each: the only pictures that show a
//             fixed scene or a moment tied to the scroll), then at four places 320 px wide (more-320-*.png) and under reduced motion
//             (more-reduced-*.png). At each of those places, and half way between the pictures of the walk, every piece of text in
//             the window is measured against the pixels really behind it there, so words that something passes behind are found
//             (more-behind-*.png shows such a place when it is not one of the pictures already). Writes more-*.png to look at, and
//             reports sideways scrolling and what causes it, invisible focus, a control that lies under something else on arrival or
//             at the end of the page, and a last screen that is mostly bare
//   --shots <n>  with --more: up to n pictures of the scroll on each device instead of 16 (4 to 40), for a long page or short moments
//
// What the page must follow for the measurements to mean something (none of it says how the page looks):
// - <html> carries lang and dir; the page has exactly one <h1>; its content sits inside one <main>.
// - Text that sits over a picture, a video, a canvas, a gradient or a texture is inside an element marked
//   data-over-picture (put it on the element that holds the text, not on the picture). That text is measured
//   against the pixels behind it; all other text is measured against the background colours behind it.
//   Text that sits over a picture without the mark is reported, because its contrast cannot be measured. A picture or a
//   canvas that fills most of the window and stays there while the page scrolls (position fixed or sticky) lies under every
//   text that passes over it.
// - Every font is served from the site folder through @font-face.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';   // resolved from kit/node_modules

const args = process.argv.slice(2);
const valued = new Set(['--out', '--shots']);
const site = args.find((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const outIdx = args.indexOf('--out');
const draft = args.includes('--draft');   // an unfinished page (a first screen alone): the rule about too little text is left out
const more = args.includes('--more');     // also 320 and 1920 px wide, text size doubled, keyboard focus and hover, as pictures and measures
const shotsIdx = args.indexOf('--shots'), maxShots = Math.min(40, Math.max(4, Math.round(Number(shotsIdx >= 0 ? args[shotsIdx + 1] : 16)) || 16));
if (!site || !fs.existsSync(path.join(site, 'index.html'))) {
  console.error('Give the site folder (the one that holds index.html): node web/check.mjs <site folder> [--out <folder>] [--draft] [--more] [--shots <n>]');
  process.exit(2);
}
const root = path.resolve(site);
const out = path.resolve(outIdx >= 0 ? args[outIdx + 1] : root.replace(/[\\/]+$/, '') + '.check');
fs.mkdirSync(out, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
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

// Nothing leaves the machine: a request to any host but the local one is refused before it is sent, and reported as a problem.
const localHost = new URL(origin).host;
const isForeign = (url) => { try { const u = new URL(url); return /^(https?|wss?):$/.test(u.protocol) && u.host !== localHost; } catch { return false; } };
async function localOnly(ctx) {
  await ctx.route('**/*', (route) => (isForeign(route.request().url()) ? route.abort('blockedbyclient') : route.continue()));
  if (ctx.routeWebSocket) await ctx.routeWebSocket(/.*/, (ws) => { if (isForeign(ws.url())) ws.close(); else ws.connectToServer(); });
}

const problems = [], notes = [], results = { site: root, origin, sizes: {} };
const fail = (m) => problems.push(m);
const MARK = 'data-over-picture';

// ---- code that runs inside the page ----
const inPage = {
  basics() {
    const html = document.documentElement;
    const has = (sel) => { const m = document.querySelector(sel); return !!(m && (m.getAttribute('content') || '').trim()); };
    return { lang: html.getAttribute('lang'), dir: html.getAttribute('dir'), h1: document.querySelectorAll('h1').length, title: document.title, modules: document.querySelectorAll('script[type="module"]').length,
             description: has('meta[name="description"]'), preview: ['og:title', 'og:description', 'og:image'].filter((k) => !has(`meta[property="${k}"]`)) };
  },
  overflow() {
    const W = document.documentElement.clientWidth, bad = [];
    const clipped = (el) => { for (let e = el.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e).overflowX; if (o !== 'visible') return true; } return false; };
    // Measured from the page's own edge, not from the window: a page that already scrolls sideways may stand scrolled (a right-to-left
    // page starts at its right end), and then everything on it looks out of place. The widest reach comes first.
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const left = r.left + scrollX, right = r.right + scrollX, by = Math.max(right - W, -left);
      if (by > 1 && getComputedStyle(el).position !== 'fixed' && !clipped(el)) bad.push([by, `${el.tagName.toLowerCase()}${el.getAttribute('class') ? '.' + el.getAttribute('class').split(' ')[0] : ''} (${Math.round(left)}..${Math.round(right)})`]);
    }
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: W, offenders: bad.sort((a, b) => b[0] - a[0]).slice(0, 6).map((b) => b[1]) };
  },
  images() {
    return [...document.images].map((i) => {
      const a = i.closest('a');
      const alone = a && !a.textContent.trim() && a.querySelectorAll('img').length === 1;
      return { src: i.getAttribute('src'), hasAlt: i.hasAttribute('alt'), alt: i.getAttribute('alt'), aloneInLink: !!alone, loaded: i.complete && i.naturalWidth > 0 };
    });
  },
  links() { return [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')); },
  // every font family that visible text asks for first, and whether a face of that name was loaded from the site
  fontStatus() {
    const generic = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong', '-apple-system', 'blinkmacsystemfont']);
    const used = new Map();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement, cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('svg')) continue;
      const fam = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
      if (!used.has(fam)) used.set(fam, { sample: n.textContent.trim().slice(0, 28), where: el.tagName.toLowerCase() + (el.getAttribute('class') ? '.' + el.getAttribute('class').split(' ')[0] : '') });
    }
    const faces = [...document.fonts];
    return [...used].map(([family, info]) => {
      const fs = faces.filter((f) => f.family.replace(/["']/g, '') === family);
      return { family, ...info, generic: generic.has(family.toLowerCase()), faces: fs.map((f) => f.status), loaded: fs.some((f) => f.status === 'loaded') };
    });
  },
  async contrast(MARK) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3]));
    const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const effBg = (el) => { // composite the background colours of the element and its ancestors, down to the page
      const layers = []; for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0) layers.push(c); if (c[3] === 1) break; }
      let base = [255, 255, 255]; for (const l of layers.reverse()) base = over(l, base); return base;
    };
    const label = (e) => e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class').split(' ')[0] : '');
    // pictures a line of text could sit on: anything drawn from pixels, bigger than an icon
    // what keeps a box in the window while the page scrolls: itself or an ancestor fixed, or a sticky ancestor (it then stays for as
    // long as that ancestor's parent is passing through the window)
    const heldBy = new Map();
    const held = (el) => {
      if (heldBy.has(el)) return heldBy.get(el);
      let h = null;
      for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') { h = { how: p, by: e }; break; } }
      heldBy.set(el, h); return h;
    };
    const media = [];
    for (const m of document.querySelectorAll('img, video, canvas, picture, svg, iframe, object, embed')) {
      if (m.parentElement && m.parentElement.closest('svg')) continue;
      const r = m.getBoundingClientRect(), s = getComputedStyle(m);
      if (r.width < 48 || r.height < 48 || s.visibility === 'hidden' || s.display === 'none') continue;
      const h = held(m), span = h && h.how === 'sticky' && h.by.parentElement ? h.by.parentElement.getBoundingClientRect() : null;
      const stays = h && r.width * r.height >= innerWidth * innerHeight * 0.6 ? h : null;   // a scene that fills most of the window and stays: text that passes is over it. A band that holds part of the window is left to the pixels of the walk
      media.push({ m, x0: r.left + scrollX, y0: r.top + scrollY, x1: r.right + scrollX, y1: r.bottom + scrollY, held: h, stays, from: span ? span.top + scrollY : -Infinity, to: span ? span.bottom + scrollY : Infinity });
    }
    const rows = new Map(), unmarked = new Map();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement, cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.closest(`[${MARK}]`)) continue;                // text over a picture is measured separately, against the picture
      const bg = effBg(el), fg = over(rgba(cs.color), bg), r = ratio(fg, bg);
      // WCAG 2.2 (1.4.3): large text, 24 px and up or 18.66 px and up in bold, needs 3:1; all other text 4.5:1
      const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && (parseInt(cs.fontWeight, 10) || 400) >= 700), need = large ? 3 : 4.5;
      const key = `${cs.color}|${bg.map(Math.round)}|${need}`;
      if (!rows.has(key) || rows.get(key).ratio > r) rows.set(key, { ratio: +r.toFixed(2), need, color: cs.color, bg: bg.map(Math.round).join(','), sample: n.textContent.trim().slice(0, 28), where: label(el) });
      // is this text really on a flat colour? a background image (or gradient) behind it, or a picture under it, means it is not
      if (el.closest('svg')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const tr = rg.getBoundingClientRect();
      if (tr.width < 1 || tr.height < 1) continue;
      let why = null, ground = null;                        // ground: the nearest ancestor with a solid colour of its own
      for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage && s.backgroundImage !== 'none') { why = `a background image or gradient on ${label(e)}`; break; } if (rgba(s.backgroundColor)[3] === 1) { ground = e; break; } }
      const cxp = tr.left + tr.width / 2 + scrollX, cyp = tr.top + tr.height / 2 + scrollY;
      if (!why) for (const p of media) {
        if (p.m.contains(n) || cxp < p.x0 || cxp > p.x1) continue;
        if (ground && !ground.contains(p.m)) continue;      // the text stands on a solid surface of its own, and the picture is not part of that surface
        const th = held(el), bothFixed = !!(p.held && th && p.held.how === 'fixed' && th.how === 'fixed');
        const together = bothFixed || (p.stays ? p.stays.by.contains(el) : !th);
        // together: neither stays, or both are held by the same thing, so they keep their places and where they stand now tells.
        // Otherwise one of them stays in the window while the other passes: a text fixed in the window meets everything in its column,
        // and a scene that stays meets every text that passes while it is held.
        const meets = together || (!p.stays && th && th.how !== 'fixed') ? cyp >= p.y0 && cyp <= p.y1 : th && th.how === 'fixed' ? true : cyp >= p.from && cyp <= p.to;
        if (meets) { why = together ? `the ${p.m.tagName.toLowerCase()} under it` : `the ${p.m.tagName.toLowerCase()} that stays in the window while the page scrolls`; break; }
      }
      if (why && !unmarked.has(label(el) + why)) unmarked.set(label(el) + why, { sample: n.textContent.trim().slice(0, 28), where: label(el), why });
    }
    const bodyBg = effBg(document.body);   // the page ground may be painted on <html> rather than <body>
    const pairs = { body: +ratio(over(rgba(getComputedStyle(document.body).color), bodyBg), bodyBg).toFixed(2) };
    return { pairs, rows: [...rows.values()].sort((a, b) => a.ratio - b.ratio), unmarked: [...unmarked.values()].slice(0, 20) };
  },
  // Every piece of text standing in the window now: one group for each element that holds text, with the boxes of its lines (window
  // coordinates, cut to the window and to what its ancestors let show), its colour and how opaque it and its ancestors make it.
  // `inside` keeps only the text inside elements matching that selector. Each element gets a number that stays its own from one call
  // to the next. A group that pixels cannot judge says why in `skip`; one whose lines all lie under something that stays in the window
  // has no boxes and says `under`.
  windowText(inside) {
    const ids = (window.__checkIds = window.__checkIds || new Map()), W = innerWidth, H = innerHeight;
    const label = (e) => e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class').split(' ')[0] : '');
    const known = new Map(), groups = new Map(), holds = new Map(), solid = new Map();
    // A thing that stays in the window (a bar, a band) with a ground of its own, lying over a box of text: the part of the box under it
    // is not text on screen, and scrolling under a bar is how a page scrolls. The browser is asked what is piled at five points of the
    // box, with every element made to answer (the NOTEXT rules switch pointer-events on while data-check-hit is set), so the pile is
    // the true order of painting. Only things with a solid colour of their own count: a see-through layer in front of the words is
    // left to the pixels.
    const cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const held = (e) => { if (!holds.has(e)) { let h = false; for (let p = e; p && p !== document.documentElement; p = p.parentElement) { const how = getComputedStyle(p).position; if (how === 'fixed' || how === 'sticky') { h = true; break; } } holds.set(e, h); } return holds.get(e); };
    const opaque = (e) => { if (!solid.has(e)) { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = getComputedStyle(e).backgroundColor; cx.fillRect(0, 0, 1, 1); solid.set(e, cx.getImageData(0, 0, 1, 1).data[3] >= 252); } return solid.get(e); };
    const showing = (el, box) => {                        // the largest part of a box of text that no such thing lies over; null when none is left
      let [x0, y0, x1, y1] = box;
      const covers = new Set();
      for (const [x, y] of [[(x0 + x1) / 2, (y0 + y1) / 2], [x0 + 1, y0 + 1], [x1 - 1, y0 + 1], [x0 + 1, y1 - 1], [x1 - 1, y1 - 1]]) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        for (const top of document.elementsFromPoint(x, y)) {
          if (top === el || top.contains(el) || el.contains(top)) break;         // the text's own place in the pile: what is below it does not cover it
          if (held(top) && opaque(top)) covers.add(top);
        }
      }
      for (const c of covers) {
        const r = c.getBoundingClientRect();
        const parts = [[x0, y0, x1, Math.min(y1, r.top - 2)], [x0, Math.max(y0, r.bottom + 2), x1, y1], [x0, y0, Math.min(x1, r.left - 2), y1], [Math.max(x0, r.right + 2), y0, x1, y1]].filter((p) => p[2] - p[0] >= 3 && p[3] - p[1] >= 3);
        if (!parts.length) return null;
        [x0, y0, x1, y1] = parts.sort((a, b) => (b[2] - b[0]) * (b[3] - b[1]) - (a[2] - a[0]) * (a[3] - a[1]))[0];
      }
      return { box: [x0, y0, x1, y1], cut: covers.size > 0 };
    };
    document.documentElement.setAttribute('data-check-hit', '');
    const about = (el) => {                               // what an element's ancestors do to its text: the part they let show, and how opaque it ends up
      if (known.has(el)) return known.get(el);
      let clip = [0, 0, W, H], opacity = 1, odd = null, cut = true, free = false;   // free: inside a box placed absolutely, until the box it is placed against
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
        const s = getComputedStyle(e);
        opacity *= parseFloat(s.opacity);
        if (s.mixBlendMode && s.mixBlendMode !== 'normal') odd = 'a blend mode';
        if (!cut || e === document.documentElement || e === document.body) continue;
        if (e === el || !(free && s.position === 'static')) {
          if (e !== el) free = false;
          if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { const r = e.getBoundingClientRect(); clip = [Math.max(clip[0], r.left), Math.max(clip[1], r.top), Math.min(clip[2], r.right), Math.min(clip[3], r.bottom)]; }
        }
        if (s.position === 'fixed') cut = false; else if (s.position === 'absolute') free = true;
      }
      const a = { clip, opacity, odd }; known.set(el, a); return a;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('svg, script, style, noscript, template, select, textarea') || (inside && !el.closest(inside))) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      const a = about(el), lines = [];
      let all = true, under = false;
      for (const r of rg.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        const x0 = Math.max(r.left, a.clip[0]), y0 = Math.max(r.top, a.clip[1]), x1 = Math.min(r.right, a.clip[2]), y1 = Math.min(r.bottom, a.clip[3]);
        if (x1 - x0 < 3 || y1 - y0 < 3) { all = false; continue; }
        if (x0 > r.left + 0.5 || y0 > r.top + 0.5 || x1 < r.right - 0.5 || y1 < r.bottom - 0.5) all = false;
        const shown = showing(el, [x0, y0, x1, y1]);
        if (!shown) { all = false; under = true; continue; }
        if (shown.cut) all = false;
        lines.push(shown.box);
      }
      if (!lines.length && !under) continue;
      let g = groups.get(el);
      if (!g) {
        if (!ids.has(el)) ids.set(el, ids.size + 1);
        const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && (parseInt(cs.fontWeight, 10) || 400) >= 700);
        const painted = `${cs.webkitBackgroundClip || ''} ${cs.backgroundClip || ''}`.includes('text');
        g = { id: ids.get(el), where: label(el), sample: '', color: cs.color, alpha: +a.opacity.toFixed(3), need: large ? 3 : 4.5, rects: [], whole: true, skip: a.odd || (painted ? 'a picture painted inside the letters' : null) };
        groups.set(el, g);
      }
      if (/\p{Emoji_Presentation}|\uFE0F/u.test(n.textContent)) g.skip = g.skip || 'an emoji';
      if (g.sample.length < 28) g.sample = (g.sample + ' ' + n.textContent.trim().replace(/\s+/g, ' ')).trim().slice(0, 28);
      g.rects.push(...lines); if (!all) g.whole = false; if (under) g.under = true;
    }
    document.documentElement.removeAttribute('data-check-hit');
    return [...groups.values()];
  },
  // every element that holds text inside a marked element, by the numbers windowText gives, from the top of the page down
  markedText(MARK) {
    const ids = (window.__checkIds = window.__checkIds || new Map()), found = new Map();
    for (const m of document.querySelectorAll(`[${MARK}]`)) {
      const walker = document.createTreeWalker(m, NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        if (!el || el.closest('svg, script, style, noscript, template, select, textarea')) continue;
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 1 || r.height < 1) continue;
        if (!ids.has(el)) ids.set(el, ids.size + 1);
        found.set(ids.get(el), r.top + scrollY);
      }
    }
    return [...found].sort((a, b) => a[1] - b[1]).map(([id]) => id);
  },
  // how far down the page must stand to bring a numbered element to a given height of the window (0.5 is its middle), read from
  // where the element is now
  scrollFor([id, at]) {
    for (const [el, i] of window.__checkIds || []) if (i === id) { const r = el.getBoundingClientRect(); return Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, Math.round(scrollY + (r.top + r.bottom) / 2 - innerHeight * at))); }
    return null;
  },
  // Contrast of each text group against the BRIGHTEST and the DARKEST 1% of the pixels behind its lines. Two pictures of the window
  // are given: one with all text made transparent (what is behind it), one with all text painted in a colour nothing else has. A line
  // where the two do not differ holds no text on screen: something lies over it there, or cuts it off. Such lines are left out, and a
  // group with none left is not judged (`hidden`). A group is what windowText returns: the boxes of its lines in window coordinates,
  // a colour and how opaque it is.
  async behind({ dataUrl, inkUrl, groups }) {
    const load = async (u) => { const img = await createImageBitmap(await (await fetch(u)).blob()); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0); return cx.getImageData(0, 0, cv.width, cv.height); };
    const bare = await load(dataUrl), inked = await load(inkUrl), d = bare.data, k = inked.data, cv = { width: Math.min(bare.width, inked.width), height: Math.min(bare.height, inked.height) }, row = bare.width, rowK = inked.width;
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const one = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    return groups.map((g) => {
      const L = [], told = { id: g.id, sample: g.sample, where: g.where, need: g.need };
      let boxes = 0;
      for (const [gx0, gy0, gx1, gy1] of g.rects) {
        const x0 = Math.max(0, Math.ceil(gx0)), x1 = Math.min(cv.width, Math.floor(gx1)), y0 = Math.max(0, Math.ceil(gy0)), y1 = Math.min(cv.height, Math.floor(gy1));   // whole pixels inside the box: its edge may be shared with something else
        const line = []; let ink = 0;
        for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
          const i = (y * row + x) * 4, j = (y * rowK + x) * 4;
          line.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
          if (Math.abs(d[i] - k[j]) + Math.abs(d[i + 1] - k[j + 1]) + Math.abs(d[i + 2] - k[j + 2]) > 90) ink++;
        }
        boxes++;
        if (ink >= Math.max(2, line.length * 0.004)) L.push(...line);                // this line's letters are on screen
      }
      if (!boxes) return { ...told, ratio: null };
      if (L.length < 6) return { ...told, ratio: null, hidden: true };
      L.sort((a, b) => a - b);
      const lo = L[Math.floor((L.length - 1) * 0.01)], hi = L[Math.floor((L.length - 1) * 0.99)];
      one.clearRect(0, 0, 1, 1); one.fillStyle = '#000'; one.fillStyle = g.color; one.fillRect(0, 0, 1, 1); const f = one.getImageData(0, 0, 1, 1).data;
      const lf = 0.2126 * lin(f[0]) + 0.7152 * lin(f[1]) + 0.0722 * lin(f[2]), a = (f[3] / 255) * (g.alpha ?? 1);
      const against = (bg) => { const lw = lf * a + bg * (1 - a); const [p, q] = lw > bg ? [lw, bg] : [bg, lw]; return (p + 0.05) / (q + 0.05); }; // approximate: alpha mix in linear light
      const rb = against(hi), rd = against(lo);
      return { ...told, ratio: +Math.min(rb, rd).toFixed(2), against: rb <= rd ? 'brightest' : 'darkest' };
    });
  },
  // Text that crosses the rounded edge of the shape that holds it: a line set too wide for a pill, an arch or a circle runs into the
  // stroke or out through the curve, and no overflow measure sees it. Two steps. This one finds the suspects by geometry: elements with
  // a visible rounded shape where a corner of a line of text lies outside the inner edge of the curve. A line's box is taller than its
  // ink, so a suspect is only a suspect: inkOutside() below decides from the pixels.
  edgeTargets() {
    const out = [], label = (e) => e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class').split(' ')[0] : '');
    const seen = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return c !== 'transparent'; const p = m[1].split(/[,\s/]+/).filter(Boolean); return p.length < 4 || parseFloat(p[3]) > 0; };
    for (const el of document.querySelectorAll('body *')) {
      if (out.length >= 24) break;
      if (el.closest('svg')) continue;
      const cs = getComputedStyle(el);
      const raw = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map((k) => cs[k]);
      if (raw.every((r) => !(parseFloat(r) > 0))) continue;
      const edge = ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && seen(cs[`border${s}Color`]));
      if (!edge && !seen(cs.backgroundColor) && cs.backgroundImage === 'none' && cs.overflow === 'visible') continue;   // a shape nobody can see
      const b = el.getBoundingClientRect();
      if (b.width < 24 || b.height < 24 || b.height > innerHeight - 100 || b.width > innerWidth) continue;
      const rx = [], ry = [];
      raw.forEach((r, i) => { const [h, v = h] = r.split(' '); rx[i] = h.endsWith('%') ? parseFloat(h) / 100 * b.width : parseFloat(h); ry[i] = v.endsWith('%') ? parseFloat(v) / 100 * b.height : parseFloat(v); });
      const f = Math.min(1, b.width / (rx[0] + rx[1] || 1), b.width / (rx[3] + rx[2] || 1), b.height / (ry[0] + ry[3] || 1), b.height / (ry[1] + ry[2] || 1));   // the browser shrinks radii that do not fit
      for (let i = 0; i < 4; i++) { rx[i] *= f; ry[i] *= f; }
      const bw = { t: parseFloat(cs.borderTopWidth) || 0, r: parseFloat(cs.borderRightWidth) || 0, b: parseFloat(cs.borderBottomWidth) || 0, l: parseFloat(cs.borderLeftWidth) || 0 };
      const corner = [[b.left + rx[0], b.top + ry[0]], [b.right - rx[1], b.top + ry[1]], [b.right - rx[2], b.bottom - ry[2]], [b.left + rx[3], b.bottom - ry[3]]];
      const inner = { left: b.left + bw.l, right: b.right - bw.r, top: b.top + bw.t, bottom: b.bottom - bw.b };
      const irx = [rx[0] - bw.l, rx[1] - bw.r, rx[2] - bw.r, rx[3] - bw.l].map((v) => Math.max(0, v)), iry = [ry[0] - bw.t, ry[1] - bw.t, ry[2] - bw.b, ry[3] - bw.b].map((v) => Math.max(0, v));
      const outside = (x, y) => {
        if (x < inner.left || x > inner.right || y < inner.top || y > inner.bottom) return true;
        for (let i = 0; i < 4; i++) {
          if (!(irx[i] > 2 && iry[i] > 2)) continue;
          const [cx, cy] = corner[i], inQuarter = (i === 0 || i === 3 ? x < cx : x > cx) && (i < 2 ? y < cy : y > cy);
          if (inQuarter && ((x - cx) / irx[i]) ** 2 + ((y - cy) / iry[i]) ** 2 > 1) return true;
        }
        return false;
      };
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let hit = null;
      for (let n; !hit && (n = walker.nextNode());) {
        if (!n.textContent.trim()) continue;
        const pe = n.parentElement, ps = getComputedStyle(pe);
        if (ps.visibility === 'hidden' || ps.display === 'none') continue;
        let placed = false;                                          // something set outside on purpose (a badge on a corner) is not held to the curve
        for (let e = pe; e && e !== el; e = e.parentElement) if (['absolute', 'fixed'].includes(getComputedStyle(e).position)) { placed = true; break; }
        if (placed) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) {
          if (r.width < 4 || r.height < 4) continue;
          if ([[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]].some(([x, y]) => outside(x, y))) { hit = n.textContent.trim().slice(0, 28); break; }
        }
      }
      if (!hit) continue;
      el.setAttribute('data-check-edge', String(out.length));
      out.push({ i: out.length, sample: hit, where: label(el), pageY: b.top + scrollY, bw, rx, ry });
    }
    return out;
  },
  // The second step: the window pictured twice, once as it is and once with the element's text painted in a colour nothing else has. The
  // pixels that differ are the ink of the text. Ink that lies beyond the inner edge of the rounded shape, in the stroke or outside it, is
  // text crossing its shape. g = the element's box in the window, its border widths and its corner radii.
  // (Whole-window pictures on purpose: a clipped screenshot lands in the wrong place on a right-to-left page that scrolls sideways.)
  async inkOutside({ a, b, g }) {
    const load = async (u) => { const im = await createImageBitmap(await (await fetch(u)).blob()); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0); return cx.getImageData(0, 0, cv.width, cv.height); };
    const A = await load(a), B = await load(b), W = Math.min(A.width, B.width), H = Math.min(A.height, B.height), keep = 2;   // text must stay this many pixels clear of the inner edge: touching a stroke of its own colour, it merges with it
    const corner = [[g.x + g.rx[0], g.y + g.ry[0]], [g.x + g.w - g.rx[1], g.y + g.ry[1]], [g.x + g.w - g.rx[2], g.y + g.h - g.ry[2]], [g.x + g.rx[3], g.y + g.h - g.ry[3]]];
    const inner = { left: g.x + g.bw.l, right: g.x + g.w - g.bw.r, top: g.y + g.bw.t, bottom: g.y + g.h - g.bw.b };
    const irx = [g.rx[0] - g.bw.l, g.rx[1] - g.bw.r, g.rx[2] - g.bw.r, g.rx[3] - g.bw.l].map((v) => Math.max(0, v)), iry = [g.ry[0] - g.bw.t, g.ry[1] - g.bw.t, g.ry[2] - g.bw.b, g.ry[3] - g.bw.b].map((v) => Math.max(0, v));
    const outside = (x, y) => {
      if (x < inner.left + keep || x > inner.right - keep || y < inner.top + keep || y > inner.bottom - keep) return true;
      for (let i = 0; i < 4; i++) {
        if (!(irx[i] > keep + 2 && iry[i] > keep + 2)) continue;
        const [cx, cy] = corner[i], inQuarter = (i === 0 || i === 3 ? x < cx : x > cx) && (i < 2 ? y < cy : y > cy);
        if (inQuarter && ((x - cx) / (irx[i] - keep)) ** 2 + ((y - cy) / (iry[i] - keep)) ** 2 > 1) return true;
      }
      return false;
    };
    let ink = 0, out = 0;
    const pad = 8, xa = Math.max(0, Math.floor(g.x - pad)), xb = Math.min(W, Math.ceil(g.x + g.w + pad)), ya = Math.max(0, Math.floor(g.y - pad)), yb = Math.min(H, Math.ceil(g.y + g.h + pad));
    for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) {
      const i = (y * A.width + x) * 4, j = (y * B.width + x) * 4;
      if (Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2]) > 90) { ink++; if (outside(x + 0.5, y + 0.5)) out++; }
    }
    return { ink, out };
  },
  // two pictures of the window, compared inside one box (window coordinates): the number of pixels that differ
  async regionDiff({ a, b, box }) {
    const load = async (u) => { const im = await createImageBitmap(await (await fetch(u)).blob()); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0); return cx.getImageData(0, 0, cv.width, cv.height); };
    const A = await load(a), B = await load(b), W = Math.min(A.width, B.width), H = Math.min(A.height, B.height);
    const xa = Math.max(0, Math.floor(box.x)), xb = Math.min(W, Math.ceil(box.x + box.width)), ya = Math.max(0, Math.floor(box.y)), yb = Math.min(H, Math.ceil(box.y + box.height));
    let n = 0;
    for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) { const i = (y * A.width + x) * 4, j = (y * B.width + x) * 4; if (Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2]) > 24) n++; }
    return n;
  },
  // Controls that are in the window but lie under something else. Asked only where no scrolling can bring them out: on arrival and at
  // the end of the page. A control passing under a bar on the way is how a page scrolls; one left under it at the end is lost.
  covered() {
    const label = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : e.getAttribute('class') ? '.' + e.getAttribute('class').split(' ')[0] : '');
    const out = [];
    for (const el of document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"]')) {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 8 || r.height < 8) continue;
      let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
      if (o < 0.1) continue;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;          // its middle is not in the window: nothing to say here
      const top = document.elementFromPoint(x, y);
      if (!top || el.contains(top) || top.contains(el)) continue;                   // itself, something inside it, or what holds it (a link broken over two lines)
      out.push({ what: label(el), text: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 24), under: label(top) });
    }
    return out.slice(0, 6);
  },
  // The tallest stretch of the window with nothing on it but the ground: rows where next to no pixel differs from the commonest colour
  // (a faint texture or grid counts as ground). Used on the last screen of the page, where a visitor should find the closing.
  async emptyRun(dataUrl) {
    const im = await createImageBitmap(await (await fetch(dataUrl)).blob()); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0);
    const d = cx.getImageData(0, 0, cv.width, cv.height).data, W = cv.width, H = cv.height, hist = new Map();
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) { const i = (y * W + x) * 4, k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4); const b = hist.get(k) || [0, 0, 0, 0]; b[0]++; b[1] += d[i]; b[2] += d[i + 1]; b[3] += d[i + 2]; hist.set(k, b); }
    let best = null; for (const b of hist.values()) if (!best || b[0] > best[0]) best = b;
    const g = [best[1] / best[0], best[2] / best[0], best[3] / best[0]];
    let run = 0, from = 0, rows = 0, at = 0;
    for (let y = 0; y < H; y++) {
      let ink = 0, n = 0;
      for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; n++; if (Math.abs(d[i] - g[0]) + Math.abs(d[i + 1] - g[1]) + Math.abs(d[i + 2] - g[2]) > 60) ink++; }
      if (ink <= Math.max(2, n * 0.004)) { if (!run) from = y; run++; if (run > rows) { rows = run; at = from; } } else run = 0;
    }
    return { rows, from: at, height: H };
  },
  textVisible() { // used with JavaScript off and with reduced motion: is the content really there and not hidden?
    const main = document.querySelector('main'), scope = main || document.body;
    const opacity = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; }; // a faded parent hides its children too
    const hidden = [];
    for (const el of scope.querySelectorAll('h1, h2, h3, p, summary')) {
      if (el.closest('details:not([open])') && !el.closest('summary')) continue;   // a closed answer is hidden on purpose until it is opened
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || opacity(el) < 0.99 || (!r.width && !r.height)) hidden.push(el.textContent.trim().slice(0, 30));
    }
    const waiting = [...scope.querySelectorAll('img, video, picture, canvas, svg')].filter((m) => {
      if (m.parentElement && m.parentElement.closest('svg')) return false;
      const r = m.getBoundingClientRect(); if (!r.width || !r.height) return false;
      return getComputedStyle(m).visibility === 'hidden' || opacity(m) < 0.1;
    }).length;
    const heads = [...scope.querySelectorAll('h2')].map((h) => h.textContent.trim());
    return { hasMain: !!main, hidden, waiting, headings: heads, chars: document.body.innerText.length, h1: document.querySelector('h1')?.innerText ?? null };
  },
};

// same browser choice as engine/render.mjs: TIRAZ_CHROMIUM, else the customer's Chrome, else Playwright's own
const exe = [process.env.TIRAZ_CHROMIUM, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sizes = [{ w: 390, h: 844, name: 'phone' }, { w: 1440, h: 900, name: 'desktop' }];
const fileOnly = new Set(), heavyFonts = new Set();
let modules = 0;

async function scrollThrough(page) { // lets reveal-on-scroll fire, like a visitor reading
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 300) { await page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: 'instant' }), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })); await page.waitForTimeout(500);
}

// Moves down (or up) the page the way a hand does, in steps of about a tenth of the window, so whatever is tied to the scroll passes
// through every state on the way. A jump can land a page in a state no visitor ever sees.
async function walkTo(page, from, to, h) {
  const step = Math.max(40, Math.round(h / 10));
  for (let y = from; y !== to;) { y = to > y ? Math.min(to, y + step) : Math.max(to, y - step); await page.evaluate((v) => window.scrollTo({ top: v, left: 0, behavior: 'instant' }), y); await page.waitForTimeout(20); }
}

// A picture of the window exactly as it stands, asked from the browser itself. Playwright's own screenshot places its clip from the scroll
// offset, and on a right-to-left page that scrolls sideways that pictures another part of the page than the one on screen (measured: off by
// the whole sideways overflow), so nothing here that is measured from a picture uses it. Whole-page pictures are not affected.
const sessions = new WeakMap();
async function windowShot(page, file) {
  let cdp = sessions.get(page);
  if (!cdp) { cdp = await page.context().newCDPSession(page); sessions.set(page, cdp); }
  const buf = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
  if (file) fs.writeFileSync(file, buf);
  return buf;
}

// Text inside each marked element, measured against the pixels behind it where a visitor reads it. The page is walked to each piece,
// so whatever is tied to the scroll stands as a visitor finds it, and the place of the text is read there, not from the top of the
// page: inside a screen that stays in the window, a text is not where it stood before the screen stuck. Then the window is pictured
// with the text made transparent, and each piece measured against what is behind its lines. A piece that is under something at the
// middle of the window (a band that stays over part of a phone screen) is brought lower, then higher, until it shows.
async function measureOverPicture(page, h) {
  let pending = await page.evaluate(inPage.markedText, MARK);
  if (!pending.length) return null;
  await page.addStyleTag({ content: NOTEXT });
  const rows = []; let at = await page.evaluate(() => Math.round(scrollY));
  for (let guard = pending.length + 8; pending.length && guard > 0; guard--) {
    const first = pending[0]; let got = [];
    for (const where of [0.5, 0.78, 0.22]) {
      const y = await page.evaluate(inPage.scrollFor, [first, where]);
      if (y === null) break;
      await walkTo(page, at, y, h); at = y; await page.waitForTimeout(400);
      const read = async () => (await page.evaluate(inPage.windowText, `[${MARK}]`)).filter((g) => pending.includes(g.id) && (g.id === first || g.whole));
      let here = await read();
      if (here.some((g) => g.alpha < 0.95)) { await page.waitForTimeout(800); here = await read(); }      // something was still arriving
      here = here.filter((g) => !g.skip);
      const me = here.find((g) => g.id === first);
      if (!me) break;                                                                                      // not there to be read, or its colour cannot be told from pixels
      if (!me.rects.length) continue;                                                                      // under a bar or a band here: try another height of the window
      got = await page.evaluate(inPage.behind, { ...await twoPictures(page), groups: here.filter((g) => g.rects.length) });
      if (got.some((r) => r.id === first && !r.hidden)) break;
    }
    const read = got.filter((r) => r.ratio !== null);
    rows.push(...read);
    const done = new Set(read.map((r) => r.id)); done.add(first);
    pending = pending.filter((i) => !done.has(i));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return rows.sort((a, b) => a.ratio - b.ratio);
}

const url = (png) => 'data:image/png;base64,' + png.toString('base64');     // a picture of the window, to hand to the page for measuring

// text that crosses the rounded edge of its shape: the suspects found by geometry, each decided from two pictures of it
async function measureEdges(page) {
  const targets = await page.evaluate(inPage.edgeTargets);
  if (!targets.length) return [];
  const paint = await page.addStyleTag({ content: '[data-check-ink], [data-check-ink] * { color: #ff00ff !important; -webkit-text-fill-color: #ff00ff !important; text-shadow: none !important; transition: none !important; }' });
  const pick = (i) => `[data-check-edge="${i}"]`, found = [];
  for (const t of targets) {
    // bring the shape into the window (a page that scrolls sideways may hold it off to one side), then picture only the part that is in it
    const box = await page.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }; }, pick(t.i));
    await page.waitForTimeout(120);
    if (box.x + box.w < 8 || box.y + box.h < 8 || box.x > box.vw - 8 || box.y > box.vh - 8) continue;   // not in the window even after scrolling: nothing to picture
    const a = await windowShot(page);
    await page.evaluate((sel) => document.querySelector(sel).setAttribute('data-check-ink', ''), pick(t.i)); await page.waitForTimeout(60);
    const b = await windowShot(page);
    await page.evaluate((sel) => document.querySelector(sel).removeAttribute('data-check-ink'), pick(t.i));
    const r = await page.evaluate(inPage.inkOutside, { a: url(a), b: url(b), g: { x: box.x, y: box.y, w: box.w, h: box.h, bw: t.bw, rx: t.rx, ry: t.ry } });
    if (r.out >= 6) found.push({ sample: t.sample, where: t.where, pixels: r.out });
  }
  await paint.evaluate((l) => l.remove());
  await page.evaluate(() => { document.querySelectorAll('[data-check-edge]').forEach((e) => e.removeAttribute('data-check-edge')); window.scrollTo(0, 0); });
  return found;
}

// The window pictured twice for a measure of its text: with every text made transparent (what is behind the words), then with every
// text painted in a colour nothing else has (where the words really show). The page needs the NOTEXT rules added once.
const allText = (state) => ['body', 'body *', 'body *::before', 'body *::after'].map((s) => `html[data-check-notext${state}] ${s}`).join(', ');
const NOTEXT = `${allText('="1"')} { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; } `
  + `${allText('="2"')} { color: #ff00ff !important; -webkit-text-fill-color: #ff00ff !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; } `
  + `${allText('')} { transition: none !important; } `
  + 'html[data-check-hit] body, html[data-check-hit] body * { pointer-events: auto !important; }';        // while windowText asks the browser what is piled at a point
async function twoPictures(page) {
  const set = (v) => page.evaluate((s) => { if (s === null) document.documentElement.removeAttribute('data-check-notext'); else document.documentElement.setAttribute('data-check-notext', s); }, v);
  await set('1'); await page.waitForTimeout(70); const bare = await windowShot(page);
  await set('2'); await page.waitForTimeout(50); const inked = await windowShot(page);
  await set('0'); await page.waitForTimeout(30); await set(null);                    // colours back first, transitions after
  return { dataUrl: 'data:image/png;base64,' + bare.toString('base64'), inkUrl: 'data:image/png;base64,' + inked.toString('base64') };
}
// Every piece of text in the window against what is really behind it at this place of the scroll. Text that is faded (arriving,
// leaving) is left out, and so is text whose colour pixels cannot give (an emoji, a blend mode, a picture painted inside the letters)
// and text that does not show there (under a bar or a band, cut off).
async function textBehind(page) {
  const groups = (await page.evaluate(inPage.windowText, null)).filter((g) => !g.skip && g.alpha >= 0.95 && g.rects.length);
  if (!groups.length) return [];
  return (await page.evaluate(inPage.behind, { ...await twoPictures(page), groups })).filter((r) => r.ratio !== null);
}
// keeps, for each piece of text, the place where it was hardest to read; says whether this place added anything
const keepWorst = (worst, rows, y, file) => { let fresh = false; for (const r of rows) { if (r.ratio >= r.need) continue; const was = worst.get(r.id); if (!was || r.ratio < was.ratio) { worst.set(r.id, { ...r, y, file }); fresh = true; } } return fresh; };
const tellBehind = (worst, where) => {
  const low = [...worst.values()].sort((a, b) => a.ratio - b.ratio);
  if (low.length) fail(`${where}, ${low.length} piece(s) of text are hard to read against what is really behind them at some place of the scroll (large text needs 3:1, other text 4.5:1, against the brightest and the darkest 1% of the pixels behind it): ${low.slice(0, 4).map((r) => `"${r.sample}" (${r.where}) ${r.ratio}:1, needs ${r.need}, against the ${r.against}, ${r.y}px down the page${r.file ? ` (${r.file})` : ''}`).join('; ')}. What is behind them there may be a thing that moves with the scroll or stays in the window, a picture, a line, or a ground too close to their own colour. Move one of the two, or give the words a ground of their own.`);
  return low;
};

for (const s of sizes) {
  const tag = `${s.w}x${s.h}`;
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, isMobile: s.w < 700, hasTouch: s.w < 700 });
  await localOnly(ctx);
  const page = await ctx.newPage();
  const consoleErrors = [], failed = [], hosts = new Set(), badStatus = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT/.test(m.text())) consoleErrors.push(m.text()); });   // a refused outside request is reported once, below
  page.on('pageerror', (e) => consoleErrors.push('page error: ' + e.message));
  page.on('requestfailed', (r) => { if (!isForeign(r.url())) failed.push(`${r.url()} (${r.failure()?.errorText})`); });
  page.on('response', (r) => { if (r.status() >= 400) badStatus.push(`${r.status()} ${r.url()}`); else if (!isForeign(r.url()) && /\.(ttf|otf)$/i.test(new URL(r.url()).pathname)) heavyFonts.add(decodeURIComponent(new URL(r.url()).pathname)); });
  page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'ws:' || u.protocol === 'wss:') hosts.add(u.host); });
  await page.goto(origin + '/', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1800);
  const R = { basics: await page.evaluate(inPage.basics), fonts: await page.evaluate(inPage.fontStatus) };
  modules = Math.max(modules, R.basics.modules);

  // screenshot of what a visitor sees first, then the whole page after scrolling through it
  await windowShot(page, path.join(out, `${tag}-top.png`));
  await scrollThrough(page);
  await page.screenshot({ path: path.join(out, `${tag}-full.png`), fullPage: true });
  R.overflow = await page.evaluate(inPage.overflow);
  R.images = await page.evaluate(inPage.images);
  R.contrast = await page.evaluate(inPage.contrast, MARK);
  R.edges = await measureEdges(page);
  R.overPicture = await measureOverPicture(page, s.h);
  const links = await page.evaluate(inPage.links);
  const ids = await page.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id));
  R.links = { total: links.length, broken: [], external: [] };
  for (const l of links) {
    if (l.startsWith('#')) { if (l.length > 1 && !ids.includes(l.slice(1))) R.links.broken.push(l + ' (no such section on the page)'); }
    else if (/^https?:\/\//i.test(l)) R.links.external.push(l);
    else if (/^(mailto|tel):/i.test(l)) { /* nothing to fetch */ }
    else { const code = await page.evaluate(async (u) => (await fetch(u, { method: 'HEAD' })).status, new URL(l, origin + '/').pathname); if (code >= 400) R.links.broken.push(`${l} (${code})`); }
  }
  R.requests = { hosts: [...hosts], failed, badStatus, consoleErrors };
  results.sizes[tag] = R;

  // problems
  if (!R.basics.lang) fail(`${tag}: the <html> element has no lang attribute.`);
  if (!['rtl', 'ltr'].includes(R.basics.dir)) fail(`${tag}: the <html> element has no dir attribute (rtl or ltr).`);
  if (R.basics.h1 !== 1) fail(`${tag}: the page has ${R.basics.h1} main headlines (h1); it should have exactly one.`);
  if (R.overflow.scrollWidth > R.overflow.clientWidth) fail(`${tag}: the page scrolls sideways (content is ${R.overflow.scrollWidth}px wide in a ${R.overflow.clientWidth}px window). Wide things: ${R.overflow.offenders.join(', ') || 'none among the page\'s elements, so look at what ::before and ::after paint and at decorative layers (a big soft shape, a texture): they must stay inside the page\'s width'}.`);
  else if (R.overflow.offenders.length) fail(`${tag}: some elements reach outside the window: ${R.overflow.offenders.join(', ')}.`);
  for (const i of R.images) {
    if (!i.hasAlt) fail(`${tag}: the image ${i.src} has no alt attribute.`);
    else if (!i.alt && i.aloneInLink) fail(`${tag}: the image ${i.src} is the only content of a link and has empty alt text.`);
    if (!i.loaded) fail(`${tag}: the image ${i.src} did not load.`);
  }
  if (R.links.broken.length) fail(`${tag}: ${R.links.broken.length} link(s) do not resolve: ${R.links.broken.join('; ')}.`);
  if (consoleErrors.length) fail(`${tag}: the browser console shows errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  if (failed.length) fail(`${tag}: ${failed.length} request(s) failed: ${failed.slice(0, 3).join('; ')}`);
  if (badStatus.length) fail(`${tag}: ${badStatus.length} request(s) got an error status: ${badStatus.slice(0, 3).join('; ')}`);
  const foreign = [...hosts].filter((h) => h !== new URL(origin).host);
  if (foreign.length) fail(`${tag}: the page asked other hosts for files: ${foreign.join(', ')}. The check refused those requests, so what they would have loaded is missing from the screenshots. Everything must come from the site folder.`);
  for (const f of R.fonts) {
    if (f.loaded) continue;
    if (f.generic || !f.faces.length) fail(`${tag}: text such as "${f.sample}" (${f.where}) is set in "${f.family}", which is not a font file served with the site, so it shows in whatever font the visitor's device has. Load the brand's font with @font-face from the site folder and use it there.`);
    else fail(`${tag}: the font "${f.family}" did not load (faces: ${f.faces.join(', ')}), so text such as "${f.sample}" shows in a fallback font.`);
  }
  if (R.contrast.pairs.body < 4.5) fail(`${tag}: body text on the background has contrast ${R.contrast.pairs.body}:1, under 4.5:1.`);
  const low = R.contrast.rows.filter((r) => r.ratio < r.need);
  if (low.length) fail(`${tag}: text with too little contrast on the page (large text needs 3:1, other text 4.5:1): ${low.slice(0, 3).map((r) => `"${r.sample}" ${r.ratio}:1, needs ${r.need}`).join('; ')}.`);
  if (R.edges.length) fail(`${tag}: text touches or crosses the rounded edge of the shape that holds it: ${R.edges.slice(0, 4).map((e) => `"${e.sample}" (${e.where})`).join('; ')}. Give the text more room inside the shape (padding), a smaller size, or a larger shape.`);
  if (R.contrast.unmarked.length) fail(`${tag}: ${R.contrast.unmarked.length} piece(s) of text sit on a picture or gradient, so their contrast cannot be measured from colours: ${R.contrast.unmarked.slice(0, 3).map((u) => `"${u.sample}" (${u.where}, over ${u.why})`).join('; ')}. Put ${MARK} on the element that holds the text, and the check measures it against the pixels behind it.`);
  const lowOver = (R.overPicture || []).filter((r) => r.ratio < r.need);
  if (lowOver.length) fail(`${tag}: text over a picture has too little contrast against the ${lowOver[0].against} 1% of what is behind it (large text needs 3:1, other text 4.5:1): ${lowOver.slice(0, 3).map((r) => `"${r.sample}" ${r.ratio}:1, needs ${r.need} (${r.against})`).join('; ')}. What is behind a text includes any border or line that crosses it.`);
  if (R.links.external.length) fileOnly.add(`${R.links.external.length} link(s) go to other websites and were not opened (no network in the check): ${[...new Set(R.links.external)].join(', ')}`);
  await ctx.close();
}

if (heavyFonts.size) {
  const list = [...heavyFonts].map((p) => { let kb = 0; try { kb = Math.round(fs.statSync(path.join(root, p)).size / 1024); } catch {} return `${path.basename(p)}${kb ? ` (${kb} KB)` : ''}`; });
  notes.push(`The page serves ${list.join(', ')} as TrueType or OpenType. As WOFF2 the same font is less than half the size and every current browser reads it: python tools/assets.py webfont <font file> writes it beside the original. Point @font-face at the .woff2, and keep the licence file with it.`);
}
if (!draft) {
  const B = Object.values(results.sizes)[0].basics;
  if (!B.description) notes.push('The page has no description (<meta name="description">): a search result then shows whatever text it finds first. One true sentence, in the brand\'s voice.');
  if (B.preview.length) notes.push(`A shared link to this page has no preview of its own: ${B.preview.join(', ')} missing. The title and the description can be written now; og:image needs the page's final address, so it waits for the customer to say where the page will live.`);
}
// ---- JavaScript off: the content must still be there and readable ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await localOnly(ctx);
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  const T = await page.evaluate(inPage.textVisible);
  await page.screenshot({ path: path.join(out, '390x844-nojs-full.png'), fullPage: true });
  results.noJs = T;
  if (!T.hasMain) fail('The page has no <main> element. Put the page content in one: assistive technology uses it to find the content, and the checks for hidden text look inside it (they looked at the whole body instead).');
  if (!T.h1) fail('With JavaScript off the headline is not on the page.');
  if (T.hidden.length) fail(`With JavaScript off ${T.hidden.length} piece(s) of text are hidden or faded: ${T.hidden.slice(0, 3).join(' | ')}`);
  if (T.waiting) fail(`With JavaScript off ${T.waiting} picture(s) stay invisible, probably waiting for a script to fade them in.`);
  if (T.chars < 200 && !draft) fail(`With JavaScript off the page has only ${T.chars} characters of text.`);
  await ctx.close();
}
// ---- reduced motion: nothing waits to be revealed, nothing is hidden ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await localOnly(ctx);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT/.test(m.text())) errs.push(m.text()); });
  await page.goto(origin + '/', { waitUntil: 'load' }); await page.waitForTimeout(1200);
  const T = await page.evaluate(inPage.textVisible);
  // a finished animation that holds its end state (fill-mode forwards or both) is still listed by getAnimations(); only a running one is a problem
  const states = await page.evaluate(() => document.getAnimations().map((a) => a.playState));
  const anim = states.filter((p) => p === 'running').length;
  results.reducedMotion = { waiting: T.waiting, hidden: T.hidden, runningAnimations: anim, finishedAnimations: states.filter((p) => p === 'finished').length, errors: errs };
  if (T.waiting) fail(`With reduced motion ${T.waiting} picture(s) still wait to appear.`);
  if (T.hidden.length) fail(`With reduced motion some text is hidden: ${T.hidden.slice(0, 3).join(' | ')}`);
  if (anim) fail(`With reduced motion ${anim} animation(s) are still running.`);
  if (errs.length) fail(`With reduced motion the console shows errors: ${errs.slice(0, 2).join(' | ')}`);
  // motion drawn by script on a canvas (a 3D scene, a particle field) is invisible to getAnimations(): picture each canvas twice and compare
  const count = await page.evaluate(() => document.querySelectorAll('canvas').length);
  let moving = 0, seen = 0;
  for (let i = 0; i < Math.min(count, 4); i++) {
    const c = await page.evaluate((k) => { const e = document.querySelectorAll('canvas')[k], s = getComputedStyle(e); e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect();
      return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(innerWidth, r.right) - Math.max(0, r.left), height: Math.min(innerHeight, r.bottom) - Math.max(0, r.top), shown: s.display !== 'none' && s.visibility !== 'hidden' }; }, i);
    if (!c.shown || c.width < 48 || c.height < 48) continue;
    seen++; await page.waitForTimeout(150);
    const a = await windowShot(page); await page.waitForTimeout(700); const b = await windowShot(page);
    if (await page.evaluate(inPage.regionDiff, { a: url(a), b: url(b), box: c }) > 8) moving++;
  }
  results.reducedMotion.canvases = { seen, moving };
  if (moving) fail(`With reduced motion ${moving} canvas(es) keep moving. A scene drawn by script must check prefers-reduced-motion itself: draw one still frame and stop the loop.`);
  await ctx.close();
}
// ---- --more: what would otherwise be checked by hand, as pictures to open, plus what a script can measure of it ----
if (more) {
  results.more = {};
  const open = async (w, h, touch) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch }); await localOnly(ctx);
    const page = await ctx.newPage(); await page.goto(origin + '/', { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
    return { ctx, page };
  };
  const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const wide = async (page) => { const o = await page.evaluate(inPage.overflow); return ` Wide things: ${o.offenders.join(', ') || 'none among the page\'s elements, so look at what ::before and ::after paint and at decorative layers'}.`; };
  // a narrow phone and a wide desktop
  for (const [w, h, name, full] of [[320, 700, 'more-320-full.png', true], [1920, 1080, 'more-1920-top.png', false]]) {
    const { ctx, page } = await open(w, h, w < 700);
    if (full) { await scrollThrough(page); await page.screenshot({ path: path.join(out, name), fullPage: true }); } else await windowShot(page, path.join(out, name));   // scrolled first, so what appears on arrival is in the picture
    const by = await sideways(page); results.more[`width${w}`] = { sideways: by };
    if (by > 1) fail(`At ${w}px wide the page scrolls sideways by ${by}px.${await wide(page)}`);
    await ctx.close();
  }
  { // the visitor's text size doubled: sizes written in rem grow, sizes written in px do not
    const { ctx, page } = await open(390, 844, true);
    const size = () => page.evaluate(() => { const e = document.querySelector('main p, main li, p'); return e ? parseFloat(getComputedStyle(e).fontSize) : null; });
    const before = await size();
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' }); await page.waitForTimeout(600);
    const after = await size(), by = await sideways(page);
    await scrollThrough(page);
    await page.screenshot({ path: path.join(out, 'more-text200-full.png'), fullPage: true });
    results.more.text200 = { sideways: by, textPx: [before, after] };
    if (by > 1) fail(`With the text size doubled the page scrolls sideways by ${by}px.${await wide(page)}`);
    if (before && after && after < before * 1.5) notes.push(`With the visitor's text size doubled, the page's text went from ${before}px to ${after}px: it does not follow the visitor's setting. Write text sizes in rem.`);
    await ctx.close();
  }
  { // the page as a visitor scrolls it, one picture of the window per screen: what a whole-page picture cannot show (a scene fixed
    // behind the page, a section that holds its screen, a moment tied to the scroll)
    for (const f of fs.readdirSync(out)) if (/^more-(scroll-(desktop|phone)-\d\d|reduced-\d|320-\d|behind-(desktop|phone)-\d\d)\.png$/.test(f)) fs.rmSync(path.join(out, f));   // the last run's own pictures
    results.more.scroll = {};
    for (const [w, h, key] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
      const { ctx, page } = await open(w, h, w < 700); await page.addStyleTag({ content: NOTEXT });
      const total = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
      const steps = Math.min(maxShots, Math.ceil(total / (h * 0.9)) + 1), shots = [], under = [], worst = new Map();
      let at = 0, bare = null, extra = 0;
      for (let i = 0; i < steps; i++) {
        const y = steps === 1 ? 0 : Math.round(total * i / (steps - 1));
        if (i > 0 && y - at > h * 0.5) {                                              // half way to the next picture: measured there too, pictured only when something is wrong
          const mid = Math.round((at + y) / 2);
          await walkTo(page, at, mid, h); at = mid; await page.waitForTimeout(500);
          const png = await windowShot(page), rows = await textBehind(page);
          if (rows.some((r) => r.ratio < r.need && (!worst.has(r.id) || r.ratio < worst.get(r.id).ratio))) {
            const name = extra < 8 ? `more-behind-${key}-${String(++extra).padStart(2, '0')}.png` : null;
            if (name) fs.writeFileSync(path.join(out, name), png);
            keepWorst(worst, rows, mid, name);
          }
        }
        await walkTo(page, at, y, h); at = y; await page.waitForTimeout(1100);         // long enough for an entrance or a counted number to finish
        const name = `more-scroll-${key}-${String(i + 1).padStart(2, '0')}.png`;
        const png = await windowShot(page, path.join(out, name)); shots.push({ file: name, y });
        keepWorst(worst, await textBehind(page), y, name);
        if (i === 0 || i === steps - 1) {
          for (const c of await page.evaluate(inPage.covered)) {
            under.push({ ...c, file: name });
            fail(`${i === 0 ? 'On arrival' : 'At the end of the page'} on a ${key} (${name}) the control ${c.what}${c.text ? ` ("${c.text}")` : ''} is in the window but lies under ${c.under}, so nobody can see or press it there. Nothing must cover a control where the page starts or where it ends: move it, or let what covers it go before then.`);
          }
        }
        if (i === steps - 1 && steps > 1) {
          bare = await page.evaluate(inPage.emptyRun, url(png));
          if (bare.rows / bare.height > 0.4) notes.push(`The last screen of the page on a ${key} is bare for ${bare.rows}px of its ${bare.height} (${name}). Look at it: the closing, with its action, should be whole on the last screen.`);
        }
      }
      results.more.scroll[key] = { pageHeight: total + h, shots, covered: under, bareAtEnd: bare ? bare.rows : 0, behind: tellBehind(worst, `On a ${key}`) };
      await ctx.close();
    }
  }
  { // the narrowest phone at four places of the scroll, as pictures of the window: a whole-page picture cannot show what stays in the window
    const { ctx, page } = await open(320, 700, true); await page.addStyleTag({ content: NOTEXT });
    const total = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight)), worst = new Map();
    let at = 0; results.more.narrow = { shots: [] };
    for (const [i, f] of [0, 1 / 3, 2 / 3, 1].entries()) {
      const y = Math.round(total * f); await walkTo(page, at, y, 700); at = y; await page.waitForTimeout(900);
      const name = `more-320-${i + 1}.png`; await windowShot(page, path.join(out, name)); results.more.narrow.shots.push({ file: name, y });
      keepWorst(worst, await textBehind(page), y, name);
      if (!total) break;
    }
    results.more.narrow.behind = tellBehind(worst, 'At 320px wide');
    await ctx.close();
  }
  { // the same page under reduced motion, on a desktop: the top, two places on the way and the end, as pictures to open
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' }); await localOnly(ctx);
    const page = await ctx.newPage(); await page.goto(origin + '/', { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
    const total = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
    let at = 0; results.more.reduced = [];
    for (const [i, f] of [0, 1 / 3, 2 / 3, 1].entries()) {
      const y = Math.round(total * f); await walkTo(page, at, y, 900); at = y; await page.waitForTimeout(600);
      const name = `more-reduced-${i + 1}.png`; await windowShot(page, path.join(out, name)); results.more.reduced.push({ file: name, y });
      if (!total) break;
    }
    await ctx.close();
  }
  { // keyboard focus on the first three things that take it, and the pointer over the first action
    const { ctx, page } = await open(1280, 800, false);
    const box = (page) => page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const r = e.getBoundingClientRect(), pad = 12;
      return { name: e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class').split(' ')[0] : ''), text: (e.textContent || '').trim().slice(0, 24),
               clip: { x: Math.max(0, r.left - pad), y: Math.max(0, r.top - pad), width: Math.min(innerWidth, r.right + pad) - Math.max(0, r.left - pad), height: Math.min(innerHeight, r.bottom + pad) - Math.max(0, r.top - pad) } };
    });
    results.more.focus = [];
    for (let i = 1; i <= 3; i++) {
      await page.keyboard.press('Tab'); await page.waitForTimeout(250);
      const b = await box(page); if (!b || b.clip.width < 2 || b.clip.height < 2) break;
      const lit = await windowShot(page, path.join(out, `more-focus-${i}.png`));
      await page.evaluate(() => { window.__was = document.activeElement; document.activeElement.blur(); }); await page.waitForTimeout(250);
      const plain = await windowShot(page);
      await page.evaluate(() => window.__was.focus({ preventScroll: true }));
      const shows = await page.evaluate(inPage.regionDiff, { a: url(lit), b: url(plain), box: b.clip }) > 0; results.more.focus.push({ element: b.name, text: b.text, shows });
      if (!shows) fail(`Keyboard focus is invisible on ${b.name} ("${b.text}"): it looks the same with and without focus. Give it a :focus-visible style in the brand's colours.`);
    }
    if (!results.more.focus.length) notes.push('Nothing on the page took keyboard focus: a page with a link or a button should.');
    const action = page.locator('main a[href], main button').first();
    if (await action.count()) {
      await page.mouse.move(2, 2); await action.scrollIntoViewIfNeeded(); await page.waitForTimeout(250);
      const r = await action.boundingBox();
      if (r) {
        const plain = await windowShot(page); await action.hover(); await page.waitForTimeout(450);
        const over = await windowShot(page, path.join(out, 'more-hover.png'));
        const r2 = await action.boundingBox() || r;                 // hovering may have scrolled it
        results.more.hover = { shows: await page.evaluate(inPage.regionDiff, { a: url(plain), b: url(over), box: { x: r2.x - 12, y: r2.y - 12, width: r2.width + 24, height: r2.height + 24 } }) > 0 };
        if (!results.more.hover.shows) notes.push('The first action looks the same with the pointer over it: a hover state tells a desktop visitor it can be pressed.');
      }
    }
    await ctx.close();
  }
}
await browser.close(); server.close();
for (const n of fileOnly) notes.push(n);
if (modules) notes.push(`The page loads ${modules} ES module script(s). Opened by double-click (file://), Chrome does not run them (not tested here): host the folder on any web server, and make sure the page reads fully without them.`);

results.ok = problems.length === 0; results.problems = problems; results.notes = notes;
fs.writeFileSync(path.join(out, 'check.json'), JSON.stringify(results, null, 1));
console.log(JSON.stringify({ ok: results.ok, problems: problems.length, screenshots: out }));
console.log(problems.length ? 'PROBLEMS:\n- ' + problems.join('\n- ') : 'No problems found by the script. Now open the screenshots and look: ' + out);
for (const n of notes) console.log('note: ' + n);
for (const [tag, R] of Object.entries(results.sizes)) console.log(`${tag}: body text ${R.contrast.pairs.body}:1; lowest text on the page ${R.contrast.rows[0] ? R.contrast.rows[0].ratio + ':1' : 'none'}; lowest text over a picture ${R.overPicture && R.overPicture[0] ? R.overPicture[0].ratio + ':1' : 'none marked'}; fonts ${R.fonts.map((f) => `"${f.family}" ${f.loaded ? 'loaded' : 'NOT loaded'}`).join(', ') || 'none'}`);
process.exit(results.ok ? 0 : 1);
