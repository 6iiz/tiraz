// Chalk motion. Nothing on a slate fades or slides: every mark is written. A word is uncovered from where the hand starts it (right
// for Arabic, left for digits and Latin) behind a slanted leading edge, at the pace of a hand; a line is pulled along its length;
// a wrong thing is struck, then rubbed out with one pass of the felt, and the right thing is written in the same place.
// This file also holds what the chalk parts share: the palette, the chalk itself (a pattern), the timing of a written text, and the
// hand-drawn strokes (underline, tick, ring, scribble).
import { clamp, rng, mix, contrast } from '/engine/kit.js';

export const lum = (h) => contrast(h, '#000000');

// The darker brand colour becomes the slate, the lighter one the white chalk, the accent the one coloured stick. A colour is
// pushed towards the chalk until it reads on the slate, so a dark accent or a pale brand still writes legibly.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  const slate = mix(dark, light, T.tone.slate);
  const lift = (c, min) => { let k = 0, o = c; while (contrast(o, slate) < min && k < 1) { k = Math.min(1, k + 0.04); o = mix(c, light, k); } return o; };
  return {
    dark, light, slate,
    chalk: mix(light, slate, 0.05),
    accent: lift(accent, 3.8),
    dim: lift(mix(slate, light, 0.55), 4.8),
    wood: mix(dark, light, T.tone.wood),
  };
}

// The chalk: a tile of the colour with the slate showing through in pores and in fine drag streaks. Built once per colour.
const tiles = new Map();
export function chalkTile(color, seed = 11) {
  const id = color + ':' + seed; if (tiles.has(id)) return tiles.get(id);
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.fillStyle = color; g.fillRect(0, 0, N, N);
  const img = g.getImageData(0, 0, N, N), d = img.data, r = rng(seed);
  for (let i = 0; i < N * N; i++) { const u = r(); d[i * 4 + 3] = Math.round(255 * (u < 0.11 ? 0.12 + u * 3.2 : 0.84 + 0.16 * r())); }
  g.putImageData(img, 0, 0);
  g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round';
  for (let i = 0; i < 260; i++) {                       // drag streaks, all leaning the same way, wrapped so the tile repeats cleanly
    const x = r() * N, y = r() * N, l = 6 + r() * 30, a = -0.42 + r() * 0.18;
    g.globalAlpha = 0.25 + r() * 0.5; g.lineWidth = 0.6 + r() * 1.3;
    for (const [ox, oy] of [[0, 0], [-N, 0], [0, -N], [-N, -N], [N, 0], [0, N]]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); }
  }
  tiles.set(id, cv); return cv;
}
const made = new WeakMap();
export function chalk(ctx, color, seed = 11) {
  const k = ctx.canvas; if (!made.has(k)) made.set(k, new Map());
  const box = made.get(k), id = color + ':' + seed;
  if (!box.has(id)) box.set(id, ctx.createPattern(chalkTile(color, seed), 'repeat'));
  return box.get(id);
}

// A word being written: uncovered from its starting side behind a slanted edge. Returns false before the hand reaches it.
export function write(ctx, p, box, size, fromRight = true) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const pad = size * 0.3, h = size * 1.05, top = box.y - h, bot = box.y + h, s = size * 0.22, e = (box.width + 2 * pad) * p;
  ctx.beginPath();
  if (fromRight) { const R = box.x + box.width + pad; ctx.moveTo(R, top); ctx.lineTo(R - e + s, top); ctx.lineTo(R - e - s, bot); ctx.lineTo(R, bot); }
  else { const L = box.x - pad; ctx.moveTo(L, top); ctx.lineTo(L + e - s, top); ctx.lineTo(L + e + s, bot); ctx.lineTo(L, bot); }
  ctx.closePath(); ctx.clip();
}

// When each word of a fitted text is written, between t0 and t1: longer words take longer, with a short lift between words.
// The returned list is in the order kit.drawText visits the words.
export function schedule(f, t0, t1, lift = 0.05) {
  const ws = f.rows.flatMap((r) => r.words), total = ws.reduce((s, w) => s + w.width, 0) || 1;
  const avail = Math.max(0.05, t1 - t0 - lift * (ws.length - 1)); let t = t0;
  return ws.map((w) => { const d = avail * (w.width / total); const o = { s: t, e: t + d }; t += d + lift; return o; });
}

// ---- hand-drawn strokes: point lists made once, drawn up to a fraction of their length ----
export function stroke(seed, x0, y0, x1, y1, amp = 4, step = 12) {
  const r = rng(seed), L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(2, Math.ceil(L / step)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  const ph = r() * 6, ph2 = r() * 6, f1 = 0.6 + r(), f2 = 2.5 + r() * 2, pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, off = amp * (0.75 * Math.sin(u * f1 * 6.283 + ph) + 0.25 * Math.sin(u * f2 * 6.283 + ph2)) * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.1));
    pts.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]);
  }
  return pts;
}
// A ring around a box that overshoots its start a little and does not quite close, as a quick hand draws it.
export function ring(seed, cx, cy, rx, ry, from = -2.4, turn = 1.1, wob = 0.05) {
  const r = rng(seed), n = 72, pts = [], ph = r() * 6;
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = from - u * turn * 6.283, k = 1 + wob * Math.sin(u * 9 + ph) + u * 0.06;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
// A tick (check mark): a short down stroke and a long up stroke, in one motion.
export function tick(seed, x, y, s) {
  return [...stroke(seed, x - s * 0.5, y - s * 0.05, x - s * 0.12, y + s * 0.38, 1.5, 6), ...stroke(seed + 1, x - s * 0.12, y + s * 0.38, x + s * 0.55, y - s * 0.5, 2.5, 8).slice(1)];
}
// A scribble through a box: a tight zig-zag running from the reading side across it.
export function scribble(seed, x0, x1, y, h, fromRight = true) {
  const r = rng(seed), pts = [], n = Math.max(6, Math.round((x1 - x0) / 34));
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = fromRight ? x1 - (x1 - x0) * u : x0 + (x1 - x0) * u;
    pts.push([x + (r() - 0.5) * 10, y + (i % 2 ? -h / 2 : h / 2) * (0.75 + r() * 0.25)]);
  }
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

// The felt: rubbing out a written thing. p 0..1: the felt crosses the box once from the reading side; what it has passed is gone and
// leaves a pale smear. box: { x0, x1, y0, y1 }. draw() paints the thing; the felt block itself is drawn on top.
export function rubOut(ctx, p, box, fromRight, P, draw) {
  if (p <= 0) { draw(); return; }
  const x0 = box.x0 - 40, x1 = box.x1 + 40, w = x1 - x0, e = w * clamp(p), y0 = box.y0, y1 = box.y1;
  const edge = fromRight ? x1 - e : x0 + e;
  if (p < 1) {
    ctx.save(); ctx.beginPath();
    if (fromRight) ctx.rect(x0 - 200, y0 - 80, edge - x0 + 200, y1 - y0 + 160); else ctx.rect(edge, y0 - 80, x1 - edge + 200, y1 - y0 + 160);
    ctx.clip(); draw(); ctx.restore();
  }
  // the smear left behind: faint chalk dragged along the felt's path
  ctx.save(); ctx.beginPath();
  if (fromRight) ctx.rect(edge, y0 - 10, x1 - edge, y1 - y0 + 20); else ctx.rect(x0, y0 - 10, edge - x0, y1 - y0 + 20);
  ctx.clip(); ctx.globalAlpha = 0.09; draw();
  const smear = chalk(ctx, P.chalk, 29), hh = y1 - y0;
  ctx.globalAlpha = 0.05;
  for (let k = 0; k < 3; k++) trace(ctx, stroke(900 + k, x0 + 30 + k * 12, y0 + hh * (0.3 + k * 0.2), x1 - 30 - k * 20, y0 + hh * (0.32 + k * 0.2), 6, 30), 1, hh * 0.22, smear);
  ctx.restore();
  if (p < 1) {                                            // the felt block, riding the edge
    const bw = 74, bh = (y1 - y0) + 60, by = y0 - 30 + Math.sin(p * 18) * 6, bx = edge - bw / 2;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.roundRect(bx + 10, by + 14, bw, bh, 10); ctx.fill();
    ctx.fillStyle = P.wood; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill();
    ctx.fillStyle = mix(P.wood, P.light, 0.35); ctx.fillRect(fromRight ? bx : bx + bw - 18, by + 6, 18, bh - 12);
    ctx.restore();
  }
}
