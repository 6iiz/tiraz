// Burin-plate motion: an engraving is built, not placed. A word is first cut as a run of fine parallel lines (the burin's first pass,
// travelling from the reading side), then a second family crosses it, then it is printed solid: tone made of lines, in three passes.
// Rules and contours are cut along their length and swell in the middle of every run. Colour comes last and by hand: a transparent
// wash of the accent is laid over the finished ink, spreading from its middle and pooling at its rim. To leave, the plate is wiped
// clean from the far side. This file also holds the palette, the swelling line, the hatch patterns, the wash and the roundel.
import { clamp, mix, contrast, rgba, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const IN = (p) => clamp(p) ** 2.2;

const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const c = rgbOf(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, ink = paper === text ? bg : text;
  let k = T.tone.soft, soft = mix(paper, ink, k);
  while (contrast(soft, paper) < 4.6 && k < 1) { k = Math.min(1, k + 0.04); soft = mix(paper, ink, k); }
  return { paper, ink, accent, soft, plate: mix(paper, ink, T.tone.plate), hair: mix(paper, ink, 0.4), wash: rgba(accent, T.tone.wash), rim: rgba(accent, 0.42) };
}

// A burin line from A to B as a filled shape: fine at entry, swelling to `w` in the middle, lifting out to a point. g: how much is cut.
export function swell(ctx, x0, y0, x1, y1, w, g = 1, from = 0) {
  if (g <= from) return;
  const L = Math.hypot(x1 - x0, y1 - y0); if (L < 1) return;
  const dx = (x1 - x0) / L, dy = (y1 - y0) / L, n = Math.max(6, Math.round(L / 10)), top = [], bot = [];
  for (let k = 0; k <= n; k++) {
    const u = from + (Math.min(1, g) - from) * (k / n), hw = (w / 2) * (0.2 + 0.8 * Math.sin(Math.PI * u) ** 0.7), cx = x0 + dx * L * u, cy = y0 + dy * L * u;
    top.push([cx - dy * hw, cy + dx * hw]); bot.push([cx + dy * hw, cy - dx * hw]);
  }
  ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
  for (const p of top) ctx.lineTo(p[0], p[1]);
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath(); ctx.fill();
}
// A rule with a lozenge at its middle, cut from the middle outward (p 0..1).
export function ornament(ctx, cx, y, w, p, P) {
  const q = E(p); if (q <= 0) return;
  ctx.fillStyle = P.ink;
  swell(ctx, cx - 18, y, cx - 18 - (w / 2 - 18) * q, y, 3.2); swell(ctx, cx + 18, y, cx + 18 + (w / 2 - 18) * q, y, 3.2);
  const s = 9 * Math.min(1, q * 3); ctx.beginPath(); ctx.moveTo(cx, y - s); ctx.lineTo(cx + s, y); ctx.lineTo(cx, y + s); ctx.lineTo(cx - s, y); ctx.closePath(); ctx.fill();
}

// The hatch patterns, made once per canvas: one family of lines, then a second crossing it.
const tiles = new Map();
function tile(color, cross) {
  const key = color + cross; if (tiles.has(key)) return tiles.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 6; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 2, 6, 1.6);
  if (cross) { g.strokeStyle = color; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-1, 7); g.lineTo(7, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(5, 7); g.lineTo(7, 5); g.stroke(); }
  tiles.set(key, c); return c;
}
const pats = new WeakMap();
function pattern(ctx, color, cross) {
  let m = pats.get(ctx); if (!m) { m = {}; pats.set(ctx, m); }
  const k = color + cross; return m[k] ?? (m[k] = ctx.createPattern(tile(color, cross), 'repeat'));
}
// A word (or any box) engraved: p 0..1. The first third cuts the first family across it from the reading side; the second third shows
// the crossing family; then it is solid. Call inside kit.drawText's each(); it sets the fill. Returns false while nothing is cut yet.
export function engrave(c, p, box, size, color, rtl) {
  if (p <= 0) return false;
  const a = clamp(p * 3);
  if (a < 1) { const w = (box.width + 16) * E(a); c.beginPath(); c.rect(rtl ? box.x + box.width + 8 - w : box.x - 8, box.y - size, w, size * 2); c.clip(); }
  c.fillStyle = inkFor(c, p, color);
}
export const inkFor = (c, p, color) => (p < 1 / 3 ? pattern(c, color, false) : p < 0.7 ? pattern(c, color, true) : color);
// The wash: a pool of transparent accent laid over the finished print, spreading from its middle; its rim is darker, as watercolour
// dries. (cx, cy) its middle, rx, ry its size; the outline wanders, fixed by `seed`.
export function wash(ctx, cx, cy, rx, ry, p, P, seed) {
  const q = E(p); if (q <= 0) return;
  const r = rng(seed), ph = [r() * 6, r() * 6, r() * 6], n = 120;
  const rad = (a) => 1 + 0.04 * Math.sin(3 * a + ph[0]) + 0.025 * Math.sin(5 * a + ph[1]) + 0.012 * Math.sin(11 * a + ph[2]);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, k = rad(a) * q; const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fillStyle = P.wash; ctx.fill(); ctx.strokeStyle = P.rim; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}
// A roundel: two ruled circles (a heavy one and a hairline), cut around from the top (p 0..1).
export function roundel(ctx, cx, cy, r, p, P, heavy = 3) {
  const q = E(p); if (q <= 0) return;
  ctx.strokeStyle = P.ink; ctx.lineWidth = heavy; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q); ctx.stroke();
  ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r - heavy - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q); ctx.stroke();
}
// The plate is wiped: everything drawn inside run() is clipped to what the wipe has not reached yet (q 0..1, from the far side).
export function wiped(ctx, q, W, H, rtl, run) {
  if (q >= 1) return;
  if (q <= 0) { run(); return; }
  const x = W * IN(q);
  ctx.save(); ctx.beginPath(); rtl ? ctx.rect(x, 0, W - x, H) : ctx.rect(0, 0, W - x, H); ctx.clip(); run(); ctx.restore();
}
