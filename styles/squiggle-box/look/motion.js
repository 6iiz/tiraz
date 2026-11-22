// Squiggle Box motion and shared drawing. Things pop: a word or a shape springs up from 70 % of its size with a small tilt that
// settles (one gentle overshoot), and leaves by shrinking a little as it thins out. Lines that strike or connect are drawn along
// their length. This file also holds the palette (paper, ink, the accent and its pastel mixes), the Memphis marks (dot, triangle,
// zigzag, square, half-disc), the "sticker" (an outlined pill with a hard offset shadow) that carries a key phrase, the word layout
// helpers, and the isometric box painter used by the diorama.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

const back = (p) => { p = clamp(p); const c = 1.4; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; };
export const POP = back;
export const out = (p) => clamp(p) ** 2;

// pops a box in around its centre: scale 0.7 → 1 with a small overshoot, a tilt that settles
export function pop(ctx, p, cx, cy, tilt = -6) {
  if (p <= 0) return false;
  const s = 0.7 + 0.3 * back(p), a = ((1 - clamp(p * 1.4)) * tilt * Math.PI) / 180;
  ctx.globalAlpha *= clamp(p * 6);
  ctx.translate(cx, cy); ctx.rotate(a); ctx.scale(s, s); ctx.translate(-cx, -cy);
}
export function leave(ctx, p, cx, cy) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const s = 1 - 0.2 * out(p); ctx.globalAlpha *= 1 - clamp(p * 1.2);
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

const lumOf = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = lumOf(bg) >= lumOf(text) ? bg : text, ink = paper === bg ? text : bg;
  const on = (fill) => (contrast(fill, paper) >= contrast(fill, ink) ? paper : ink);
  const pastel = mix(accent, paper, 0.58), soft = mix(ink, paper, 0.8), deep = mix(accent, ink, 0.38);
  return {
    paper, ink, accent, pastel, soft, deep, on,
    shade: mix(ink, accent, 0.25),                 // the hard shadow under stickers
    grey: mix(ink, paper, 0.42),
    sky: mix(paper, accent, 0.1),
    ticketA: mix(paper, accent, 0.16), ticketB: mix(paper, ink, 0.08),
    onAccent: on(accent), onPastel: on(pastel),
    face: (base, k) => (k > 0 ? mix(base, paper, k) : mix(base, ink, -k)),
  };
}

// ---------- Memphis marks ----------
// kind: 0 dot, 1 triangle, 2 zigzag, 3 square, 4 half-disc. Centred on (x, y), about s wide.
export function mark(ctx, P, kind, x, y, s, color) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = Math.min(5, Math.max(2, s * 0.09)); ctx.fillStyle = color;
  ctx.beginPath();
  if (kind === 0) ctx.arc(x, y, s / 2, 0, Math.PI * 2);
  else if (kind === 1) { ctx.moveTo(x, y - s / 2); ctx.lineTo(x + s / 2, y + s * 0.42); ctx.lineTo(x - s / 2, y + s * 0.42); ctx.closePath(); }
  else if (kind === 3) ctx.rect(x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8);
  else if (kind === 4) { ctx.arc(x, y + s * 0.2, s / 2, Math.PI, 0); ctx.closePath(); }
  if (kind === 2) {
    ctx.strokeStyle = color; ctx.lineWidth = Math.min(9, Math.max(3, s * 0.16));
    for (let i = 0; i <= 4; i++) { const px = x - s / 2 + (i * s) / 4, py = y + (i % 2 ? -s * 0.22 : s * 0.22); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
  } else { ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
// the row of three marks over the text zone (dot, triangle, zigzag), each popping in on its own
export function marksRow(ctx, P, t, t0, x, y, rtl, gone = 0) {
  const kinds = [[0, P.accent], [1, P.pastel], [2, P.ink]];
  kinds.forEach(([k, c], i) => {
    const p = (t - t0 - i * 0.08) / 0.4; if (p <= 0 || gone >= 1) return;
    const cx = rtl ? x - 20 - i * 58 : x + 20 + i * 58, cy = y + Math.sin(t * 2.2 + i) * 2.5;
    ctx.save(); pop(ctx, p, cx, cy, 20); leave(ctx, gone, cx, cy); mark(ctx, P, k, cx, cy, 34, c); ctx.restore();
  });
}

// ---------- the sticker ----------
// An outlined pill with a hard offset shadow (shadow dotted with a halftone of paper), drawn under a key phrase or a value.
export function sticker(ctx, P, x0, x1, y0, y1, fill, { off = 9, r = null } = {}) {
  const rad = r ?? (y1 - y0) / 2;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = P.shade; ctx.beginPath(); ctx.roundRect(x0 + off, y0 + off, x1 - x0, y1 - y0, rad); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = rgba(P.paper, 0.5);
  for (let y = y0 + off + 4, j = 0; y < y1 + off; y += 9, j++) for (let x = x0 + off + (j % 2) * 4.5; x < x1 + off; x += 9) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = fill; ctx.strokeStyle = P.ink; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, rad); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// A squiggle drawn along its length from x0 to x1 at y (p 0..1 of its length): the strike-through.
export function squiggle(ctx, x0, x1, y, p, color, w = 7, amp = 9, rtl = true) {
  if (p <= 0) return;
  const n = 48, len = Math.floor(n * clamp(p));
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= len; i++) { const u = i / n, x = rtl ? x1 - (x1 - x0) * u : x0 + (x1 - x0) * u, yy = y + Math.sin(u * Math.PI * 7) * amp; if (i) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }
  ctx.stroke(); ctx.restore();
}

// ---------- words ----------
export function layout(f, x0, x1, y, rtl, align = 'start') {
  const res = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start') === rtl ? x1 - row.width : x0;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; res.push({ i: i++, key: w.key, x: wl, y: yy, width: w.width, row: r }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return res;
}
export function runs(boxes) {
  const res = [];
  for (const b of boxes) {
    if (!b.key) continue;
    const r = res.at(-1);
    if (r && r.row === b.row && r.last === b.i - 1) { r.x0 = Math.min(r.x0, b.x); r.x1 = Math.max(r.x1, b.x + b.width); r.last = b.i; }
    else res.push({ row: b.row, y: b.y, x0: b.x, x1: b.x + b.width, first: b.i, last: b.i });
  }
  return res;
}
export function widen(f, extra, maxW) {
  for (const r of f.rows) if (r.words.length > 1) extra = Math.min(extra, (maxW - r.width) / (r.words.length - 1));
  extra = Math.max(0, extra); f.space += extra;
  for (const r of f.rows) r.width += extra * (r.words.length - 1);
  f.width = Math.max(...f.rows.map((r) => r.width));
  return f;
}
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.4; w -= 20) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}

// ---------- isometric painter (diorama) ----------
export function iso(ox, oy, s) {
  const c = Math.cos(Math.PI / 6);
  return (X, Y, Z = 0) => [ox + (X - Y) * c * s, oy + (X + Y) * 0.5 * s - Z * s];
}
export function poly(g, pts, fill, P, lw = 3) {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.strokeStyle = P.ink; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
}
