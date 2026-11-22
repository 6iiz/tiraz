// Floating-world motion: a print is not thrown, it is unrolled. Every panel (a cartouche, a slip, a seal's frame) opens from the
// reading side as a hanging scroll does, a wooden roller travelling ahead of the paper; it leaves by being rolled up from the far side.
// Colour blocks are printed a hair out of register with the black key line and settle into place as they land. Nothing bounces, nothing
// fades as its main move. This file also holds what the parts share: the palette, the cartouche, the roller, the key block, the seal.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;          // laid down: a soft landing
export const R = (p) => 1 - (1 - clamp(p)) ** 2.2;        // the unroll: quick start, long gentle finish
export const OUT = (p) => clamp(p) ** 2.4;                // rolled up: accelerates away

const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const c = rgbOf(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export { rgbOf };

// Paper is the brand's lighter colour, the key block its darker one, the colour block its accent. `on` reads on the accent.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, ink = paper === text ? bg : text;
  const on = contrast(ink, accent) >= contrast(paper, accent) ? ink : paper;
  let k = T.tone.soft, soft = mix(paper, ink, k);
  while (contrast(soft, paper) < 4.6 && k < 1) { k = Math.min(1, k + 0.04); soft = mix(paper, ink, k); }
  return {
    paper, ink, accent, on, soft,
    mist: mix(paper, accent, T.tone.mist), mount: mix(paper, ink, T.tone.mount),
    pale: mix(accent, paper, 0.22), far: mix(paper, ink, 0.1), near: mix(paper, ink, 0.2), wave: mix(paper, accent, T.tone.wave), deep: mix(paper, accent, T.tone.wave + 0.2),
  };
}

// The part of a panel (x, y, w, h) that is open. p: how far it has unrolled, q: how far it has been rolled up again.
// Returns { x0, x1, edge } (edge: where the roller is, or null when the panel is still) or false when nothing shows.
export function unroll(p, q, x, w, rtl) {
  const a = R(p), b = OUT(q);
  if (a <= 0 || b >= 1) return false;
  let x0, x1, edge = null;
  if (rtl) { x1 = x + w; x0 = Math.max(x + w * (1 - a), x + w * b); if (a < 1 || b > 0) edge = x0; }
  else { x0 = x; x1 = Math.min(x + w * a, x + w * (1 - b)); if (a < 1 || b > 0) edge = x1; }
  return x1 - x0 < 0.5 ? false : { x0, x1, edge };
}
// Runs draw() clipped to the open part of the panel, then draws the roller at its edge.
export function scroll(ctx, p, q, x, y, w, h, rtl, P, draw, roller = true) {
  const u = unroll(p, q, x, w, rtl);
  if (!u) return;
  ctx.save(); ctx.beginPath(); ctx.rect(u.x0, y - 40, u.x1 - u.x0, h + 80); ctx.clip(); draw(); ctx.restore();
  if (roller && u.edge !== null) rod(ctx, u.edge, y, h, P, rtl);
}
// The roller: a wooden rod a little taller than the paper, with turned ends, and the shadow it casts on the open side.
export function rod(ctx, x, y, h, P, rtl) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(rtl ? x : x - 10, y, 10, h);
  ctx.fillStyle = P.mount; ctx.fillRect(x - 8, y - 14, 16, h + 28);
  ctx.fillStyle = P.ink; ctx.fillRect(x - 11, y - 26, 22, 13); ctx.fillRect(x - 11, y + h + 13, 22, 13);
  ctx.fillRect(x - 1, y - 14, 2, h + 28);
  ctx.restore();
}
// A cartouche: a flat field of paper inside a heavy key line and a hairline, as a print's title box is cut.
export function cartouche(ctx, x, y, w, h, P, fill = P.paper, line = P.ink) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = line; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.lineWidth = 1.5; ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
}
// The colour block behind a key word: the accent wiped lighter toward its foot (a short bokashi), printed off register by `k` times the
// sheet's error, under a black key line that is exactly in place. Returns the colour the word is set in.
export function keyBlock(ctx, box, size, P, T, k = 1) {
  const x = box.x - size * 0.16, y = box.y - size * 0.7, w = box.width + size * 0.32, h = size * 1.38;
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, P.accent); g.addColorStop(1, P.pale);
  ctx.fillStyle = g; ctx.fillRect(x + T.reg.x * k, y + T.reg.y * k, w, h);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  return P.on;
}
// Where the key words of a fitted text sit, with neighbouring key words on one row joined into one run, so a key phrase (*two words*)
// gets one block across it. Measured once (in create) on a scratch canvas. Returns [{ x, y, width }].
export function keyRuns(kit, f, opts) {
  const c = document.createElement('canvas').getContext('2d'), runs = []; let last = null;
  kit.drawText(c, f, { ...opts, decor: true, each: (w, i, box) => {
    if (!w.key) { last = null; return false; }
    if (last && last.row === box.row && last.i === i - 1) {
      const a = Math.min(last.run.x, box.x), b = Math.max(last.run.x + last.run.width, box.x + box.width);
      last.run.x = a; last.run.width = b - a; last.i = i;
    } else { const run = { x: box.x, y: box.y, width: box.width }; runs.push(run); last = { run, row: box.row, i }; }
    return false;
  } });
  return runs;
}
// A seal: a square of the accent with rounded corners, the logo cut out of it in paper, stamped down (p 0..1: scale settles from 1.2).
export function seal(ctx, brand, cx, cy, s, P, p = 1) {
  if (p <= 0) return;
  const k = 1 + 0.2 * (1 - E(p));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 6);
  ctx.fillStyle = P.accent; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.09); ctx.fill();
  ctx.strokeStyle = P.on; ctx.lineWidth = Math.max(1.5, s * 0.018); ctx.beginPath(); ctx.roundRect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84, s * 0.05); ctx.stroke();
  brand.logo.draw(ctx, -s * 0.3, -s * 0.3, s * 0.6, P.on);
  ctx.restore();
}
// A band of mist: a long flat band with rounded ends that thins away at both ends, drawn across (x .. x + w) at height y.
export function mist(ctx, x, y, w, h, color, alpha = 1) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, rgba(color, 0)); g.addColorStop(0.18, color); g.addColorStop(0.82, color); g.addColorStop(1, rgba(color, 0));
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y - h / 2, w, h, h / 2); ctx.fill(); ctx.restore();
}
