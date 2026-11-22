// Marker motion. Everything on the white board is written by a marker that floats on its own (no hand): it flies in from off the
// board, writes each word at the pace of a hand (the word is uncovered behind the nib), lifts between words (its shadow grows when it
// lifts), draws a ring round the key word, and flies off again. The camera travels along the board between ideas (the joint).
// This file holds what the marker parts share: the palette, the ink (a pattern with dry streaks), where each word of a fitted text
// sits, the timing of a written text, hand-drawn strokes, and the floating marker itself.
import { clamp, rng, mix, contrast, lerp, ease } from '/engine/kit.js';

export const lum = (h) => contrast(h, '#000000');

// The lighter brand colour is the board, the darker one the black marker, the accent the coloured marker. A marker colour is pushed
// towards the black marker until it reads on the board.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  const board = light;
  const deepen = (c, min) => { let k = 0, o = c; while (contrast(o, board) < min && k < 1) { k = Math.min(1, k + 0.04); o = mix(c, dark, k); } return o; };
  return {
    dark, light, board,
    ink: mix(dark, board, 0.04),
    accent: deepen(accent, 3.6),
    soft: deepen(mix(board, dark, 0.5), 4.6),
    ghost: mix(board, dark, T.tone.ghost),
    rail: mix(board, dark, T.tone.rail),
  };
}

// The ink: the colour with fine dry streaks running along the stroke direction (mostly level). Built once per colour.
const tiles = new Map();
export function inkTile(color, board, seed = 5) {
  const id = color + board + seed; if (tiles.has(id)) return tiles.get(id);
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'), r = rng(seed);
  g.fillStyle = color; g.fillRect(0, 0, N, N);
  g.strokeStyle = mix(color, board, 0.28); g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const x = r() * N, y = r() * N, l = 20 + r() * 90; g.globalAlpha = 0.25 + r() * 0.45; g.lineWidth = 0.5 + r() * 1.2;
    for (const ox of [0, -N, N]) { g.beginPath(); g.moveTo(x + ox, y); g.lineTo(x + ox + l, y + (r() - 0.5) * 3); g.stroke(); }
  }
  tiles.set(id, cv); return cv;
}
const made = new WeakMap();
export function ink(ctx, color, board, seed = 5) {
  const k = ctx.canvas; if (!made.has(k)) made.set(k, new Map());
  const box = made.get(k), id = color + seed;
  if (!box.has(id)) box.set(id, ctx.createPattern(inkTile(color, board, seed), 'repeat'));
  return box.get(id);
}

// Where kit.drawText puts each word of a fitted text (same rule as the kit), so the marker can be sent there before it is drawn.
export function layout(f, { x0, x1, y, align = 'start' }, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, arabic: w.arabic, key: w.key, size: f.size }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}

// A word being written: uncovered from its starting side behind a slanted edge (the nib). Returns false before the nib reaches it.
export function write(ctx, p, box, size, fromRight = true) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const pad = size * 0.3, h = size * 1.05, top = box.y - h, bot = box.y + h, s = size * 0.18, e = (box.width + 2 * pad) * p;
  ctx.beginPath();
  if (fromRight) { const R = box.x + box.width + pad; ctx.moveTo(R, top); ctx.lineTo(R - e + s, top); ctx.lineTo(R - e - s, bot); ctx.lineTo(R, bot); }
  else { const L = box.x - pad; ctx.moveTo(L, top); ctx.lineTo(L + e - s, top); ctx.lineTo(L + e + s, bot); ctx.lineTo(L, bot); }
  ctx.closePath(); ctx.clip();
}
export function schedule(f, t0, t1, lift = 0.06) {
  const ws = f.rows.flatMap((r) => r.words), total = ws.reduce((s, w) => s + w.width, 0) || 1;
  const avail = Math.max(0.05, t1 - t0 - lift * (ws.length - 1)); let t = t0;
  return ws.map((w) => { const d = avail * (w.width / total); const o = { s: t, e: t + d }; t += d + lift; return o; });
}

// ---- strokes: point lists made once, drawn up to a fraction of their length ----
export function stroke(seed, x0, y0, x1, y1, amp = 3, step = 14) {
  const r = rng(seed), L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(2, Math.ceil(L / step)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  const ph = r() * 6, f1 = 0.5 + r() * 0.8, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n, off = amp * Math.sin(u * f1 * 6.283 + ph) * Math.sin(Math.PI * u); pts.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]); }
  return pts;
}
// A loose ring: starts a little past the top, runs round once and overshoots, as a quick hand circles a word.
export function ring(seed, cx, cy, rx, ry, turn = 1.12) {
  const r = rng(seed), n = 80, pts = [], ph = r() * 6, from = -1.9 + r() * 0.3;
  for (let i = 0; i <= n; i++) { const u = i / n, a = from - u * turn * 6.283, k = 1 + 0.04 * Math.sin(u * 7 + ph) + u * 0.07; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return pts;
}
// A loose box round a rectangle: four strokes that run a little past their corners, drawn as one path.
export function box(seed, x0, y0, x1, y1) {
  const r = rng(seed), o = () => 8 + r() * 10;
  return [...stroke(seed, x1 + o(), y0, x0 - o(), y0 + 3, 2), ...stroke(seed + 1, x0, y0 - o(), x0 + 3, y1 + o(), 2), ...stroke(seed + 2, x0 - o(), y1, x1 + o(), y1 - 3, 2), ...stroke(seed + 3, x1, y1 + o(), x1 - 3, y0 - o(), 2)];
}
// An arrow: a gently bowed shaft and a two-stroke head, all one path (shaft, then head).
export function arrow(seed, x0, y0, x1, y1, bow = 0.12, head = 34) {
  const L = Math.hypot(x1 - x0, y1 - y0), mx = (x0 + x1) / 2 - (y1 - y0) * bow, my = (y0 + y1) / 2 + (x1 - x0) * bow, pts = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1]); }
  const a = Math.atan2(y1 - pts[22][1], x1 - pts[22][0]);
  pts.push([x1 - Math.cos(a - 0.5) * head, y1 - Math.sin(a - 0.5) * head], [x1, y1], [x1 - Math.cos(a + 0.5) * head, y1 - Math.sin(a + 0.5) * head]);
  return pts;
}
// Draws pts up to fraction p and returns where the nib is.
export function trace(ctx, pts, p, width, style) {
  p = clamp(p); if (pts.length < 2) return pts[0];
  let total = 0; const seg = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(total); }
  const L = total * p; let tip = pts[0];
  if (ctx && p > 0) { ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); }
  for (let i = 1; i < pts.length; i++) {
    if (seg[i] <= L) { tip = pts[i]; if (ctx && p > 0) ctx.lineTo(tip[0], tip[1]); continue; }
    const k = (L - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
    tip = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; if (ctx && p > 0) ctx.lineTo(tip[0], tip[1]); break;
  }
  if (ctx && p > 0) { ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
  return tip;
}
export const tipOf = (pts, p) => trace(null, pts, p);

// ---- the floating marker ----
// A job is { s, e, at(p) -> [x, y], color }: the nib follows at() while the job runs. Between jobs the marker lifts and glides to the
// next start; before the first it flies in from above the reading side, after the last it flies off. Returns null when off the board.
export function penAt(jobs, t, W, rtl) {
  if (!jobs.length) return null;
  const home = [rtl ? W + 260 : -260, -220], first = jobs[0], last = jobs[jobs.length - 1];
  if (t < first.s - 0.3 || t > last.e + 0.4) return null;
  if (t < first.s) { const q = ease.outCubic((t - first.s + 0.3) / 0.3), a = first.at(0); return { x: lerp(home[0], a[0], q), y: lerp(home[1], a[1], q), lift: 1 - q, color: first.color }; }
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (t <= j.e) {
      if (t >= j.s) { const a = j.at(clamp((t - j.s) / (j.e - j.s || 1))); return { x: a[0], y: a[1], lift: 0, color: j.color }; }
      const pj = jobs[i - 1], a = pj.at(1), b = j.at(0), q = ease.inOutCubic((t - pj.e) / (j.s - pj.e || 1));
      return { x: lerp(a[0], b[0], q), y: lerp(a[1], b[1], q) - Math.sin(Math.PI * q) * 30, lift: Math.sin(Math.PI * q), color: q < 0.5 ? pj.color : j.color };
    }
  }
  const q = ease.inQuad((t - last.e) / 0.4), a = last.at(1);
  return { x: lerp(a[0], home[0], q), y: lerp(a[1], home[1], q), lift: q, color: last.color };
}
// A job that writes one word: the nib runs along the word's middle from its starting side, with a small up-and-down of handwriting.
export function wordJob(b, s, e, color) {
  const from = b.arabic ? b.x + b.width : b.x, to = b.arabic ? b.x : b.x + b.width;
  return { s, e, color, at: (p) => [lerp(from, to, p), b.y + b.size * (0.12 + 0.18 * Math.sin(p * 23))] };
}
export const pathJob = (pts, s, e, color) => ({ s, e, color, at: (p) => tipOf(pts, p) });

// The marker: a capped barrel leaning back from the nib, with a cast shadow that drifts further away as it lifts.
export function drawPen(ctx, pen, P, rtl) {
  if (!pen) return;
  const lift = clamp(pen.lift), ang = rtl ? -2.45 : -0.69, len = 215, wid = 30;
  ctx.save(); ctx.translate(pen.x, pen.y - lift * 22);
  const sh = 14 + lift * 40;
  ctx.save(); ctx.translate(sh * 0.7, sh); ctx.rotate(ang); ctx.fillStyle = `rgba(0,0,0,${0.16 - lift * 0.06})`;
  ctx.beginPath(); ctx.roundRect(12, -wid / 2, len, wid, 12); ctx.fill(); ctx.restore();
  ctx.rotate(ang);
  ctx.fillStyle = pen.color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, -6); ctx.lineTo(16, 6); ctx.closePath(); ctx.fill();     // the nib
  ctx.fillStyle = mix(P.board, P.dark, 0.12); ctx.beginPath(); ctx.roundRect(14, -wid / 2 + 4, 36, wid - 8, 6); ctx.fill();           // the collar
  ctx.fillStyle = mix(P.board, P.dark, 0.06); ctx.beginPath(); ctx.roundRect(46, -wid / 2, len - 46, wid, 10); ctx.fill();            // the barrel
  ctx.fillStyle = pen.color; ctx.beginPath(); ctx.roundRect(len - 70, -wid / 2 - 2, 74, wid + 4, 10); ctx.fill();                     // the cap end
  ctx.fillStyle = pen.color; ctx.fillRect(80, -wid / 2, 100, 7);                                                                       // the label stripe
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(52, -wid / 2 + 5, len - 60, 4);
  ctx.restore();
}
