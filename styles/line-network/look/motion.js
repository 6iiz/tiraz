// Motion of line-network: a metro map printed on paper. Lines grow by being drawn: each one reaches only as far as its pen has gone, held to
// eight directions with one fillet radius at every corner. Stops appear when the tip passes them and their names are printed out of
// the stop, sliding a few pixels away from it. An interchange lands with weight: it is set a little too big and drops into place.
// Things leave by being printed over with a fresh sheet (the joint), or the group slides a little and clears.
// This file also holds what the map parts share: the inks, routes (polylines with filleted corners measured by length), stops.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outCubic;
export const D = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };            // a pen at an even hand, easing at both ends
export const I = ease.inQuad;
// a stop dropping into place: critically damped, no bounce, starting 18% too big
export const land = (p) => { p = clamp(p); const w = 9; return 1 + 0.18 * (1 + w * p * 0.6) * Math.exp(-w * p * 0.6) * (p < 1 ? 1 : 0); };

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The sheet is the lighter brand colour, the ink the darker. Three map lines: the accent, the ink tinted by the accent, and the accent
// lifted toward the sheet. Water and printed panels are tints of ink on the sheet.
export function inks(brand, T) {
  const { bg, text, accent } = brand.colors, tn = T.tone;
  const [ink, paper] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const on = (fill) => (contrast(fill, ink) >= contrast(fill, paper) ? ink : paper);
  const lines = [accent, mix(ink, accent, tn.line2), mix(accent, paper, tn.line3)];
  return { ink, paper, accent, on, lines, onAccent: on(accent), table: mix(ink, '#000000', 0.25),
    dim: mix(ink, paper, tn.dim), faint: mix(paper, ink, tn.faint), water: mix(paper, ink, tn.water), ghost: (c) => mix(paper, c, tn.ghost) };
}

// A route: an octilinear polyline whose corners are rounded with one radius. It is flattened once into short straight pieces, so it
// can be drawn to any length.
export function route(pts, r = 40) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const k = Math.min(r, l1 / 2, l2 / 2), u = [(b[0] - a[0]) / l1, (b[1] - a[1]) / l1], v = [(c[0] - b[0]) / l2, (c[1] - b[1]) / l2];
    const p0 = [b[0] - u[0] * k, b[1] - u[1] * k], p1 = [b[0] + v[0] * k, b[1] + v[1] * k];
    for (let s = 0; s <= 8; s++) { const q = s / 8, m = 1 - q; out.push([m * m * p0[0] + 2 * m * q * b[0] + q * q * p1[0], m * m * p0[1] + 2 * m * q * b[1] + q * q * p1[1]]); }
  }
  out.push(pts.at(-1));
  const seg = []; let total = 0;
  for (let i = 1; i < out.length; i++) { const l = Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]); seg.push(l); total += l; }
  return { pts: out, seg, total };
}
export function at(R, a) {
  a = clamp(a, 0, R.total); let s = 0;
  for (let i = 1; i < R.pts.length; i++) { const l = R.seg[i - 1]; if (s + l >= a) { const u = (a - s) / (l || 1), p0 = R.pts[i - 1], p1 = R.pts[i]; return [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u]; } s += l; }
  return R.pts.at(-1);
}
// The length along a route where it is nearest to x (for a mostly level route) or y.
export function lengthAt(R, v, axis = 0) {
  let s = 0, best = 0, bd = Infinity;
  for (let i = 1; i < R.pts.length; i++) {
    const p0 = R.pts[i - 1], p1 = R.pts[i], l = R.seg[i - 1];
    for (let q = 0; q <= 1; q += 0.25) { const d = Math.abs(p0[axis] + (p1[axis] - p0[axis]) * q - v); if (d < bd) { bd = d; best = s + l * q; } }
    s += l;
  }
  return best;
}
// Draw a route from length a to b in one colour; the pen tip is drawn when `tip` is set and the line is still growing.
export function line(ctx, R, color, w, a = 0, b = Infinity, tip = false) {
  a = clamp(a, 0, R.total); b = clamp(b, 0, R.total); if (b <= a) return;
  ctx.beginPath(); let s = 0, started = false;
  for (let i = 1; i < R.pts.length; i++) {
    const l = R.seg[i - 1], p0 = R.pts[i - 1], p1 = R.pts[i];
    const u0 = clamp((a - s) / (l || 1)), u1 = clamp((b - s) / (l || 1));
    if (u1 > u0) {
      if (!started) { ctx.moveTo(p0[0] + (p1[0] - p0[0]) * u0, p0[1] + (p1[1] - p0[1]) * u0); started = true; }
      ctx.lineTo(p0[0] + (p1[0] - p0[0]) * u1, p0[1] + (p1[1] - p0[1]) * u1);
    }
    s += l; if (s >= b) break;
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  if (tip && b < R.total) { const [x, y] = at(R, b); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, w * 0.85, 0, Math.PI * 2); ctx.fill(); }
}
// A plain stop: a short tick on the line, on the side given by (nx, ny).
export function tick(ctx, x, y, nx, ny, color, w, p = 1) {
  if (p <= 0) return; const L = w * 0.9 * clamp(p * 2);
  ctx.strokeStyle = color; ctx.lineWidth = w * 0.7; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + nx * (w * 0.4 + L), y + ny * (w * 0.4 + L)); ctx.stroke();
}
// An interchange: a white capsule with a heavy ink outline, `len` long, dropped into place.
export function capsule(ctx, x, y, len, w, I_, p = 1, vertical = false) {
  if (p <= 0) return; const s = land(p);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (vertical) ctx.rotate(Math.PI / 2);
  const h = w * 1.6; ctx.beginPath(); ctx.roundRect(-len / 2 - h / 2, -h / 2, len + h, h, h / 2);
  ctx.fillStyle = I_.paper; ctx.fill(); ctx.strokeStyle = I_.ink; ctx.lineWidth = w * 0.36; ctx.stroke(); ctx.restore();
}
// A round station: paper with an ink ring.
export function station(ctx, x, y, r, I_, p = 1) {
  if (p <= 0) return; const s = land(p);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = I_.paper; ctx.fill(); ctx.strokeStyle = I_.ink; ctx.lineWidth = r * 0.42; ctx.stroke(); ctx.restore();
}
// A station name printed out of its stop: it slides `dx` px away from the stop while it is uncovered from that side.
export function print(ctx, p, box, size, fromRight) {
  if (p <= 0) return false; if (p >= 1) return;
  const e = E(p), w = box.width + 20, r = w * e, h = size * 1.8;
  ctx.beginPath(); ctx.rect(fromRight ? box.x + box.width + 10 - r : box.x - 10, box.y - h / 2, r, h); ctx.clip();
  ctx.translate((fromRight ? 1 : -1) * (1 - e) * size * 0.35, 0);
}
export function boxes(kit, f, o) {
  const out = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, each: (w, i, b) => { out.push({ ...b, key: w.key, i }); return false; } });
  return out;
}
// A name plate in a line's colour behind a key word, the word set on it in the colour that reads best.
export function plate(ctx, b, size, color, p = 1) {
  if (p <= 0) return; const s = land(p), w = b.width + size * 0.42, h = size * 1.25;
  ctx.save(); ctx.translate(b.x + b.width / 2, b.y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2 - size * 0.04, w, h, h * 0.22); ctx.fill(); ctx.restore();
}

// Key words next to each other on one row share one backing: their boxes merged per row.
export function spans(bs) {
  const rows = new Map();
  for (const b of bs) { const r = rows.get(b.row); if (!r) rows.set(b.row, { ...b }); else { const x0 = Math.min(r.x, b.x), x1 = Math.max(r.x + r.width, b.x + b.width); r.x = x0; r.width = x1 - x0; } }
  return [...rows.values()];
}
