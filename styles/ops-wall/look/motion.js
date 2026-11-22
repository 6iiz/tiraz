// Ops-wall motion: a briefing being worked on a whiteboard. Words are written: each one uncovered in the reading direction at the
// pace of a marker (wider words take longer), the wet tip riding the edge. Cards land on the board with weight (a little large, a
// long shadow that snaps short) and a magnet drops onto them. Marks (loops, arrows, dimension lines) are drawn along their length.
// What is rejected is wiped by the eraser and left as a ghost. This file holds what the parts share.
import { clamp, mix, contrast, rgba, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const LAND = (p) => 1 - (1 - clamp(p)) ** 6;
export const I = (p) => clamp(p) ** 2.4;
const lum = (h) => contrast(h, '#000000');

// Board = the lighter brand colour (enamel), graphite = the darker, the accent is the decision marker, and a mix of accent and
// graphite is the measuring marker.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const board = lum(text) >= lum(bg) ? text : bg, ink = board === text ? bg : text;
  let k = T.tone.soft, soft = mix(ink, board, k);
  while (contrast(soft, board) < 4.6 && k > 0) { k -= 0.04; soft = mix(ink, board, Math.max(0, k)); }
  return {
    board, ink, accent, soft, measure: mix(accent, ink, T.tone.measure), ghost: rgba(ink, T.tone.ghost),
    card: mix(board, ink, T.tone.card), cardEdge: mix(board, ink, T.tone.cardEdge), frame: mix(board, ink, T.tone.frame),
    onAccent: contrast(ink, accent) >= contrast(board, accent) ? ink : board,
  };
}

// When each word of a fitted text starts being written, at `speed` px a second plus a short lift between words.
export function writeTimes(f, t0, speed = 2400, lift = 0.07) {
  const out = []; let t = t0;
  for (const row of f.rows) for (const w of row.words) { out.push([t, t + w.width / speed + 0.04]); t += w.width / speed + lift; }
  out.end = t; return out;
}
// A word being written: a clip that grows from the reading side, with the marker's tip at its edge; a tiny seeded tilt and
// baseline wobble so the lettering is hand-set. Use in drawText's `each`. Returns false before the word is begun.
export function write(ctx, t, span2, box, size, rtl, tipColor, seed) {
  const [a, b] = span2, p = clamp((t - a) / (b - a));
  if (p <= 0) return false;
  const r = rng(seed), tilt = (r() - 0.5) * 0.02, dy = (r() - 0.5) * size * 0.05;
  ctx.translate(box.x + box.width / 2, box.y + dy); ctx.rotate(tilt); ctx.translate(-(box.x + box.width / 2), -box.y);
  if (p >= 1) return;
  const h = size * 1.8, w = (box.width + size * 0.3) * p, x = rtl ? box.x + box.width + size * 0.15 - w : box.x - size * 0.15;
  ctx.fillStyle = tipColor; ctx.beginPath(); ctx.arc(rtl ? x : x + w, box.y + size * (0.15 - 0.3 * Math.sin(p * 20)), size * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.rect(x, box.y - h / 2, w, h); ctx.clip();
}

// A polyline drawn along its length to p (0..1). pts: [[x, y], …].
export function stroke(ctx, pts, p, width, color) {
  p = clamp(p); if (p <= 0 || pts.length < 2) return;
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const end = L.at(-1) * p;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha *= 0.92;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= end) ctx.lineTo(pts[i][0], pts[i][1]);
    else { const u = (end - L[i - 1]) / (L[i] - L[i - 1]); ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); break; }
  }
  ctx.stroke(); ctx.restore();
}
// A hand-drawn loop around a box (cx, cy, rx, ry), a little more than one turn, wobbling. Points are made once.
export function loop(cx, cy, rx, ry, seed, start = -2.4) {
  const r = rng(seed), pts = [], n = 64, j = r() * 6;
  for (let i = 0; i <= n; i++) { const a = start - (i / n) * Math.PI * 2.15, w = 1 + 0.04 * Math.sin(a * 3 + j) + (i / n) * 0.06; pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
  return pts;
}
// A slightly wavering straight line from a to b.
export function line(a, b, seed, wob = 3) {
  const r = rng(seed), pts = [], n = 16, ph = r() * 6;
  for (let i = 0; i <= n; i++) { const u = i / n, nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1, o = Math.sin(u * 7 + ph) * wob * Math.sin(u * Math.PI);
    pts.push([a[0] + (b[0] - a[0]) * u + (nx / l) * o, a[1] + (b[1] - a[1]) * u + (ny / l) * o]); }
  return pts;
}
// An arrow head at b pointing away from a.
export function head(a, b, s = 26) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return [[b[0] + Math.cos(ang + 2.6) * s, b[1] + Math.sin(ang + 2.6) * s], b, [b[0] + Math.cos(ang - 2.6) * s, b[1] + Math.sin(ang - 2.6) * s]];
}

// A card (a print) landing on the board around its centre: p 0..1 lands it, q 0..1 lifts it away. Draws its shadow and its paper,
// then runs body() in its frame. Returns false when nothing shows.
export function card(ctx, x, y, w, h, P, p, q, turn, body) {
  if (p <= 0 || q >= 1) return false;
  const e = LAND(p), o = I(q), s = 1 + 0.07 * (1 - e) + 0.05 * o, lift = (1 - e) + o;
  ctx.save(); ctx.globalAlpha *= clamp(p * 5) * (1 - clamp(o * 1.5));
  ctx.translate(x + w / 2, y + h / 2 - o * 60); ctx.rotate(turn); ctx.scale(s, s); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.shadowColor = rgba('#000000', 0.16 + 0.1 * lift); ctx.shadowBlur = 10 + 40 * lift; ctx.shadowOffsetX = 4 + 22 * lift; ctx.shadowOffsetY = 6 + 30 * lift;
  ctx.fillStyle = P.card; ctx.fillRect(x, y, w, h);
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = P.cardEdge; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
  body();
  ctx.restore();
}
// A round magnet dropped onto a card: falls from a little above, its shadow closing in.
export function magnet(ctx, x, y, r, color, p) {
  if (p <= 0) return;
  const e = LAND(p), dy = -(1 - e) * 40;
  ctx.save(); ctx.globalAlpha *= clamp(p * 5);
  ctx.fillStyle = rgba('#000000', 0.22); ctx.beginPath(); ctx.arc(x + 3 + 10 * (1 - e), y + 5 + 14 * (1 - e), r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y + dy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.35); ctx.beginPath(); ctx.arc(x - r * 0.3, y + dy - r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// The eraser: a felt block wiping across a band (x0..x1 around ym, height h) in the reading direction, p 0..1. What it has passed is
// left as a ghost: callers draw the passed part with low opacity. Returns the x the eraser has reached.
export const eraserX = (p, x0, x1, rtl) => { const e = clamp(p); return rtl ? x1 - (x1 - x0 + 160) * e : x0 + (x1 - x0 + 160) * e; };
export function eraser(ctx, p, x0, x1, ym, h, P, rtl) {
  const e = clamp(p), x = eraserX(p, x0, x1, rtl);
  if (e > 0 && e < 1) {
    ctx.save(); ctx.translate(x, ym); ctx.rotate(rtl ? 0.08 : -0.08);
    ctx.fillStyle = rgba('#000000', 0.18); ctx.fillRect(-40 + 10, -h * 0.55 + 14, 80, h * 1.1);
    ctx.fillStyle = P.frame; ctx.fillRect(-40, -h * 0.55, 80, h * 1.1);
    ctx.fillStyle = P.ink; ctx.fillRect(-40, -h * 0.55, 80, h * 0.25);
    ctx.restore();
  }
  return x;
}
