// Dot-file motion: everything in the file is printed or stamped, never slid or faded in. A word or a block slams down from a little
// above the page (scale shrinking fast to 1, a few frames), lands with no bounce and stays; a whole exhibit leaves by being flipped up
// off the page. The accent prints a hair out of register behind heavy ink. This file holds what the parts share: the palette, the
// stamp and slam, the misprinted text, halftone tiles and dot fields, the ink chip and the rubber's wear.
import { clamp, mix, contrast, rgba, rng } from '/engine/kit.js';

export const E = (p) => { p = clamp(p); return p >= 1 ? 1 : 1 - 2 ** (-11 * p); };     // the slam: nearly all of it in the first frames
export const I = (p) => clamp(p) ** 2.2;
const lum = (h) => contrast(h, '#000000');

// Paper is the lighter brand colour, ink the darker; the accent is the second drum. `on(fill)` picks the brand colour that reads on it.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, ink = paper === text ? bg : text;
  const on = (fill) => (contrast(fill, ink) >= contrast(fill, paper) ? ink : paper);
  let k = T.tone.soft, soft = mix(ink, paper, k);
  while (contrast(soft, paper) < 4.6 && k > 0) { k -= 0.04; soft = mix(ink, paper, Math.max(0, k)); }
  return {
    paper, ink, accent, on, soft, onAccent: on(accent), onInk: paper,
    rule: mix(paper, ink, T.tone.rule), folder: mix(paper, ink, T.tone.folder),
    dotAccent: mix(accent, ink, T.tone.dotDark), dotInk: mix(paper, ink, T.tone.dotInk),
  };
}

// The slam: a thing drawn around its centre (cx, cy), coming down from scale 1 + `from` and landing flat. q: flipped off the page.
// Returns false when nothing shows. A slight turn may be given (radians), kept at landing: a stamp is never square.
export function slam(ctx, p, q, cx, cy, from = 0.45, turn = 0) {
  if (p <= 0 || q >= 1) return false;
  const e = E(p), s = 1 + from * (1 - e), o = I(q);
  ctx.globalAlpha *= clamp(p * 6) * (1 - clamp(o * 1.4));
  ctx.translate(cx, cy - o * 160); ctx.rotate(turn * (0.5 + 0.5 * e)); ctx.scale(s, s * (1 - o * 0.5)); ctx.translate(-cx, -cy);
}
// Per word: each word slams around its own centre.
export const slamWord = (t, t0, q, from = 0.35) => (w, i, box, c) => slam(c, (t - t0(i)) / 0.16, q, box.x + box.width / 2, box.y, from);

// A halftone tile: one dot of `density` (share of the cell's area) in a cell of `step` px.
export function dotTile(step, density, color) {
  const c = document.createElement('canvas'); c.width = c.height = step;
  const g = c.getContext('2d'); g.fillStyle = color; g.beginPath(); g.arc(step / 2, step / 2, step * Math.sqrt(density / Math.PI), 0, Math.PI * 2); g.fill();
  return c;
}
export function screen(ctx, tile, deg) {
  const p = ctx.createPattern(tile, 'repeat'); p.setTransform(new DOMMatrix().rotate(deg)); return p;
}
// A field of halftone dots on its own canvas (w x h): dot radius follows density(x, y) in 0..1; a turned grid of `step`.
export function dotField(w, h, step, deg, color, density, k = 0.68) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), a = (deg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), R = Math.hypot(w, h);
  g.fillStyle = color; g.beginPath();
  for (let u = -R; u < R; u += step) for (let v = -R; v < R; v += step) {
    const x = w / 2 + u * ca - v * sa, y = h / 2 + u * sa + v * ca;
    if (x < -step || y < -step || x > w + step || y > h + step) continue;
    const dn = density(x, y); if (dn <= 0.02) continue;
    const r = Math.min(1, dn) * step * k; g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2);
  }
  g.fill(); return c;
}
// Specks of paper colour that show where a rubber stamp did not take ink. Built once, drawn clipped to a stamp's border.
export function wearTile(color, seed = 31) {
  const N = 160, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), r = rng(seed); g.fillStyle = color;
  for (let i = 0; i < 260; i++) { g.globalAlpha = 0.5 + r() * 0.5; g.beginPath(); g.arc(r() * N, r() * N, 0.6 + r() * 2.2, 0, Math.PI * 2); g.fill(); }
  return c;
}

// Heavy text printed twice: the accent a few pixels out of register under the ink. o: kit.drawText options (x0, x1, y, align, each).
export function misprint(kit, ctx, f, o, P, reg) {
  ctx.save(); ctx.translate(reg.x, reg.y);
  kit.drawText(ctx, f, { ...o, color: P.accent, key: rgba(P.accent, 0), decor: true });
  ctx.restore();
  kit.drawText(ctx, f, { ...o, color: P.ink, key: P.ink });
}

// A rubber stamp block: accent fill, a double rule inside its edge, wear on the edge only. (x, y, w, h) in the current transform.
export function stampBlock(ctx, x, y, w, h, P, wear) {
  ctx.fillStyle = P.accent; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = P.onAccent; ctx.lineWidth = 3; ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
  if (wear) { ctx.save(); ctx.beginPath(); ctx.rect(x - 2, y - 2, w + 4, h + 4); ctx.rect(x + 14, y + 14, w - 28, h - 28); ctx.clip('evenodd');
    ctx.fillStyle = ctx.createPattern(wear, 'repeat'); ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.restore(); }
}
// An ink chip: a solid block of ink with a notch cut from its far corner (a file tab), on which text is set in paper.
export function chip(ctx, x, y, w, h, P, rtl) {
  ctx.fillStyle = P.ink; ctx.beginPath();
  const n = Math.min(18, h * 0.35);
  if (rtl) { ctx.moveTo(x + n, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + n); }
  else { ctx.moveTo(x, y); ctx.lineTo(x + w - n, y); ctx.lineTo(x + w, y + n); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); }
  ctx.closePath(); ctx.fill();
}
