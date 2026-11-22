// Doodle-note motion. One page of visual notes made while you watch, always in the same order: the fineliner draws the outline of a
// shape (a banner, a box, a badge, a fat arrow), the grey marker shades it in a few quick strokes, then the words are written in it,
// and the one thing that matters gets a swipe of highlighter behind it. Nothing fades or slides in; between notes the page scrolls.
// This file holds what the doodle parts share: the palette, the outlines as point lists, tracing, shading, writing and the highlighter.
import { clamp, rng, mix, contrast, rgba } from '/engine/kit.js';

export const lum = (h) => contrast(h, '#000000');

// The lighter brand colour is the paper, the darker one the fineliner, greys are the darker colour thinned into the paper, and the accent
// is the highlighter: light enough that fineliner text reads on it.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  const paper = light, ink = mix(dark, paper, 0.03);
  let k = T.tone.highlight, hl = mix(paper, accent, k);
  while (contrast(ink, hl) < 5.5 && k > 0.15) { k -= 0.03; hl = mix(paper, accent, k); }
  // when the accent is close to the paper, deepen it instead so the swipe still shows
  if (contrast(hl, paper) < 1.15) hl = mix(paper, dark, 0.12);
  let note = mix(paper, dark, 0.5), j = 0.5; while (contrast(note, paper) < 4.8 && j < 1) { j += 0.04; note = mix(paper, dark, j); }
  return { dark, light, paper, ink, hl, note, accent,
    grey: mix(paper, dark, T.tone.grey), greyDeep: mix(paper, dark, T.tone.grey * 1.9), dot: mix(paper, dark, T.tone.dot) };
}

// ---- outlines (point lists, drawn up to a fraction of their length) ----
export function line(seed, x0, y0, x1, y1, amp = 2, step = 16) {
  const r = rng(seed), L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(2, Math.ceil(L / step)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L, ph = r() * 6, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n, off = amp * Math.sin(u * 5.2 + ph) * Math.sin(Math.PI * u); pts.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]); }
  return pts;
}
const join = (...ls) => ls.reduce((a, l) => a.concat(a.length ? l.slice(1) : l), []);
// A rounded box, started at the top corner on the reading side and drawn round once, closing with a small overlap.
export function roundBox(seed, x0, y0, x1, y1, r = 26, rtl = true) {
  const pts = [], arc = (cx, cy, a0, a1) => { for (let i = 0; i <= 8; i++) { const a = a0 + (a1 - a0) * (i / 8); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  const q = rng(seed), j = () => (q() - 0.5) * 3;
  arc(x1 - r, y0 + r, -Math.PI / 2, 0); arc(x1 - r, y1 - r, 0, Math.PI / 2); arc(x0 + r, y1 - r, Math.PI / 2, Math.PI); arc(x0 + r, y0 + r, Math.PI, Math.PI * 1.5);
  pts.push([x1 - r + 14, y0 + 1]);
  const out = pts.map(([x, y]) => [x + j(), y + j()]);
  return rtl ? out : out.map(([x, y]) => [x0 + x1 - x, y]);      // mirrored so it starts on the left in a left-to-right brand
}
// A ribbon banner: the band, with a folded tail at each end. Returns { outline, band:[x0,y0,x1,y1], tails:[polygons] }.
export function banner(seed, cx, cy, w, h, th = h) {           // th: the size the tails are drawn for (a taller band keeps one-row tails)
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, t = th * 0.9, dy = th * 0.32;
  const tailR = [[x1 - 10, y0 + dy], [x1 + t, y0 + dy], [x1 + t - th * 0.32, y1 - th * 0.18 + dy * 0.5], [x1 + t, y1 + dy], [x1 - 10, y1 + dy]];
  const tailL = tailR.map(([x, y]) => [2 * cx - x, y]);
  const outline = join(line(seed, x1, y0, x0, y0), line(seed + 1, x0, y0, x0, y1), line(seed + 2, x0, y1, x1, y1), line(seed + 3, x1, y1, x1, y0 - 4));
  return { outline, band: [x0, y0, x1, y1], tails: [tailR, tailL] };
}
// A fat arrow (an outlined arrow with a body), pointing from (x0, y0) to (x1, y1).
export function fatArrow(seed, x0, y0, x1, y1, body = 44, head = 100) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, b = body / 2, hx = x1 - ux * head * 0.9, hy = y1 - uy * head * 0.9;
  const P = (x, y, s) => [x + nx * s, y + ny * s];
  const poly = [P(x0, y0, b), P(hx, hy, b), P(hx, hy, head * 0.55), [x1, y1], P(hx, hy, -head * 0.55), P(hx, hy, -b), P(x0, y0, -b), P(x0, y0, b)];
  const outline = join(...poly.slice(1).map((p, i) => line(seed + i, poly[i][0], poly[i][1], p[0], p[1], 1.5, 18)));
  return { outline, poly };
}
export function circle(seed, cx, cy, rx, ry, turn = 1.04) {
  const r = rng(seed), pts = [], ph = r() * 6;
  for (let i = 0; i <= 72; i++) { const u = i / 72, a = -Math.PI / 2 - u * turn * 6.283, k = 1 + 0.025 * Math.sin(u * 6 + ph); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return pts;
}
export function trace(ctx, pts, p, width, style) {
  p = clamp(p); if (p <= 0 || pts.length < 2) return;
  let total = 0; const seg = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(total); }
  const L = total * p;
  ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    if (seg[i] <= L) { ctx.lineTo(pts[i][0], pts[i][1]); continue; }
    const k = (L - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
    ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); break;
  }
  ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
const pathOf = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); };

// The grey marker: fills a shape with a few broad diagonal strokes laid from the reading side, so the fill grows stroke by stroke.
// shape: a point list (closed), or a function that builds the path. Overlaps between strokes are a shade deeper, as real marker is.
export function shade(ctx, p, shape, bb, color, rtl = true, seed = 1) {
  p = clamp(p); if (p <= 0) return;
  const [x0, y0, x1, y1] = bb, h = y1 - y0, w = x1 - x0, n = Math.max(3, Math.ceil(w / 70)), r = rng(seed);
  ctx.save(); if (typeof shape === 'function') shape(ctx); else pathOf(ctx, shape); ctx.clip();
  ctx.fillStyle = color; ctx.globalAlpha = 0.85;
  const done = p * n;
  for (let i = 0; i < Math.ceil(done); i++) {
    const f = Math.min(1, done - i), sw = w / n + 28, cx = rtl ? x1 - (i + 0.5) * (w / n) : x0 + (i + 0.5) * (w / n), lean = (h + 8) * 0.3;
    const yt = y0 - 4, yb = yt + (h + 8) * f, xs = (y) => cx + lean / 2 - lean * ((y - yt) / (h + 8));
    ctx.beginPath(); ctx.moveTo(xs(yt) - sw / 2, yt); ctx.lineTo(xs(yt) + sw / 2, yt); ctx.lineTo(xs(yb) + sw / 2, yb); ctx.lineTo(xs(yb) - sw / 2, yb);
    ctx.closePath(); ctx.globalAlpha = 0.55 + r() * 0.2; ctx.fill();
  }
  ctx.restore();
}
export function fillPoly(ctx, pts, color) { ctx.save(); pathOf(ctx, pts); ctx.fillStyle = color; ctx.fill(); ctx.restore(); }

// The highlighter: one broad stroke behind a box, swiped from the reading side, its ends slightly ragged and tilted.
export function highlight(ctx, p, box, size, color, rtl = true) {
  p = clamp(p); if (p <= 0) return;
  const x0 = box.x - size * 0.18, x1 = box.x + box.width + size * 0.18, h = size * 0.82, w = (x1 - x0) * p, y = box.y - h / 2 + size * 0.06;
  const a = rtl ? x1 - w : x0, b = rtl ? x1 : x0 + w;
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(a + 6, y + 4); ctx.lineTo(b - 4, y - 2); ctx.quadraticCurveTo(b + 6, y + h / 2, b - 2, y + h + 2); ctx.lineTo(a + 2, y + h + 5); ctx.quadraticCurveTo(a - 8, y + h / 2, a + 6, y + 4);
  ctx.fill(); ctx.restore();
}

// A word being written: uncovered from its starting side behind a slanted edge. Returns false before the pen reaches it.
export function write(ctx, p, box, size, fromRight = true) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const pad = size * 0.3, h = size * 1.05, top = box.y - h, bot = box.y + h, s = size * 0.2, e = (box.width + 2 * pad) * p;
  ctx.beginPath();
  if (fromRight) { const R = box.x + box.width + pad; ctx.moveTo(R, top); ctx.lineTo(R - e + s, top); ctx.lineTo(R - e - s, bot); ctx.lineTo(R, bot); }
  else { const L = box.x - pad; ctx.moveTo(L, top); ctx.lineTo(L + e - s, top); ctx.lineTo(L + e + s, bot); ctx.lineTo(L, bot); }
  ctx.closePath(); ctx.clip();
}
export function schedule(f, t0, t1, lift = 0.05) {
  const ws = f.rows.flatMap((r) => r.words), total = ws.reduce((s, w) => s + w.width, 0) || 1;
  const avail = Math.max(0.05, t1 - t0 - lift * (ws.length - 1)); let t = t0;
  return ws.map((w) => { const d = avail * (w.width / total); const o = { s: t, e: t + d }; t += d + lift; return o; });
}
// Where kit.drawText puts each word (the kit's own rule), so a highlight can be laid before the words are drawn.
export function layout(f, { x0, x1, y, align = 'center' }, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, arabic: w.arabic, key: w.key }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
// A writer for kit.drawText: each word uncovered on its own schedule.
export const writer = (t, sched, size) => (w, i, box, c) => { if (write(c, Math.min(1, Math.max(0, (t - sched[i].s) / (sched[i].e - sched[i].s || 1))), box, size, w.arabic) === false) return false; };
export { rgba };
