// Motion of gouge-print: the frame is a block covered in ink, and only wood that has been carved away lets light through. No fades:
// paper shows up as patches carved row after row, each cut lengthening from the reading side, blunt where it starts and thin where it ends;
// letters cut into the block appear as hatching that widens until the strokes merge. Whatever is printed in ink (text on a carved
// patch) is simply the wood that was left standing. To leave, the block is inked again: a brayer of ink rolls down over the frame.
// This file also holds what the parts share: the palette, the cut, the carved patch, the hatched reveal, the brayer.
import { clamp, mix, contrast, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 2.4;        // a cut: fast bite, slowing as the gouge lifts
export const IN = (p) => clamp(p) ** 2;                    // the brayer accelerates down the block

const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const c = rgbOf(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

// Ink = the brand's darker colour (the block), paper = its lighter colour (what is cut away), accent = the one colour, kept for the key.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, ink = paper === text ? bg : text;
  const on = contrast(ink, accent) >= contrast(paper, accent) ? ink : paper;
  let k = T.tone.soft, soft = mix(paper, ink, k);
  while (contrast(soft, ink) < 4.6 && k > 0) { k = Math.max(0, k - 0.04); soft = mix(paper, ink, k); }
  return { paper, ink, accent, on, soft, grain: mix(ink, paper, T.tone.grain), flap: mix(ink, paper, T.tone.flap) };
}

// One cut from A to B, `w` wide, as a closed path: a blunt entry, a full body, a tapered exit, edges chipped by the wood.
// g (0..1) is how far the gouge has travelled; the moving tip is rounded off. jit: the chip pattern (from cutShape).
export function cutShape(x0, y0, x1, y1, w, seed, taper = 0.28) {
  const L = Math.hypot(x1 - x0, y1 - y0), N = Math.max(4, Math.round(L / 14)), r = rng(seed);
  const jt = [], jb = [];
  for (let k = 0; k <= N; k++) { jt.push((r() - 0.5) * w * 0.22); jb.push((r() - 0.5) * w * 0.22); }
  return { x0, y0, x1, y1, w, L, N, jt, jb, taper };
}
export function cutPath(path, c, g = 1) {
  if (g <= 0) return;
  g = Math.min(1, g);
  const dx = (c.x1 - c.x0) / c.L, dy = (c.y1 - c.y0) / c.L, nx = -dy, ny = dx, tip = Math.min(1, (c.w * 1.2) / c.L);
  const prof = (s) => (s < 0.06 ? 0.62 + s * 6.3 : s > 1 - c.taper ? Math.max(0, (1 - s) / c.taper) ** 0.75 : 1) * Math.min(1, Math.sqrt(Math.max(0, (g - s) / tip)));
  const top = [], bot = [];
  for (let k = 0; k <= c.N; k++) {
    const s = Math.min(k / c.N, g), cx = c.x0 + dx * c.L * s, cy = c.y0 + dy * c.L * s, hw = (c.w / 2) * prof(s);
    top.push([cx + nx * (hw + c.jt[k] * prof(s)), cy + ny * (hw + c.jt[k] * prof(s))]);
    bot.push([cx - nx * (hw + c.jb[k] * prof(s)), cy - ny * (hw + c.jb[k] * prof(s))]);
    if (k / c.N >= g) break;
  }
  path.moveTo(top[0][0], top[0][1]);
  for (const p of top) path.lineTo(p[0], p[1]);
  for (let i = bot.length - 1; i >= 0; i--) path.lineTo(bot[i][0], bot[i][1]);
  path.closePath();
}

// A patch of the block carved away to paper, (x, y, w, h), row by row from the top, each row two cuts that run from the reading side
// past the far edge. draw(ctx, p, color): p 0..1 is the carving's progress.
export function patch(x, y, w, h, seed, rtl, T) {
  const C = T.cut, n = Math.max(2, Math.ceil((h - C.width * 0.3) / C.pitch) + 1), r = rng(seed), cuts = [];
  for (let i = 0; i < n; i++) {
    const yy = y + C.width * 0.32 + (i * (h - C.width * 0.64)) / (n - 1), sd = rtl ? -1 : 1, o = C.over;
    const xa = rtl ? x + w + o + r() * 10 : x - o - r() * 10, xb = rtl ? x - 60 - r() * 12 : x + w + 60 + r() * 12;
    const xm = (xa + xb) / 2 + (r() - 0.5) * w * 0.16, lift = (r() - 0.5) * 4;
    const e1 = xm + sd * 60, L1 = Math.abs(e1 - xa), tp1 = Math.min(0.28, 70 / L1), s2 = e1 - sd * (L1 * tp1 + 50), L2 = Math.abs(xb - s2);
    cuts.push([cutShape(xa, yy + lift, e1, yy - lift, C.width, seed * 31 + i * 2, tp1), i]);
    cuts.push([cutShape(s2, yy - lift, xb, yy + lift * 0.5, C.width, seed * 31 + i * 2 + 1, Math.min(0.28, 56 / L2)), i]);
  }
  return {
    draw(ctx, p, color) {
      if (p <= 0) return;
      const path = new Path2D();
      cuts.forEach(([c, i], j) => {
        const half = j % 2, a = (i / n) * 0.45, s = a + half * 0.28, g = E(clamp((p - s) / 0.27));
        cutPath(path, c, g);
      });
      ctx.fillStyle = color; ctx.fill(path);
    },
  };
}
// Letters cut into the block: run draw() clipped to `n` horizontal bands across (x, y, w, h) whose thickness grows with p until they
// merge, so the letters are first a hatching and then solid light.
export function hatch(ctx, p, x, y, w, h, draw, pitch = 9) {
  if (p <= 0) return;
  if (p >= 1) { draw(); return; }
  const th = pitch * Math.min(1.05, E(p) * 1.1);
  ctx.save(); ctx.beginPath();
  for (let yy = y; yy < y + h; yy += pitch) ctx.rect(x, yy + (pitch - th) / 2, w, th);
  ctx.clip(); draw(); ctx.restore();
}
// The brayer: the block is inked again from the top, its front edge a little uneven. q 0..1.
export function brayer(ctx, q, W, H, P, y0 = 24, y1 = H - 24) {
  if (q <= 0) return;
  const yy = y0 + (y1 - y0) * IN(q);
  ctx.save(); ctx.beginPath(); ctx.rect(27, 27, W - 54, H - 54); ctx.clip();
  ctx.fillStyle = P.ink; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0);
  for (let x = W; x >= 0; x -= 60) ctx.lineTo(x, yy + 6 * Math.sin(x * 0.05 + q * 9));
  ctx.closePath(); ctx.fill();
  if (q < 1) { ctx.fillStyle = P.grain; ctx.fillRect(0, yy - 4, W, 4); }
  ctx.restore();
}
// A colour block printed under a key word: a slab of the accent with chipped edges, rolled on from the reading side (p 0..1).
export function colour(ctx, p, x, y, w, h, P, rtl, seed) {
  if (p <= 0) return;
  const r = rng(seed), q = E(p), ww = w * q, x0 = rtl ? x + w - ww : x;
  ctx.fillStyle = P.accent; ctx.beginPath();
  const j = () => (r() - 0.5) * 5;
  ctx.moveTo(x0 + j(), y + j());
  for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + (ww * k) / 6 + j(), y + j());
  ctx.lineTo(x0 + ww + j(), y + h + j());
  for (let k = 5; k >= 0; k--) ctx.lineTo(x0 + (ww * k) / 6 + j(), y + h + j());
  ctx.closePath(); ctx.fill();
}
