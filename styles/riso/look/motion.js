// Riso motion: everything is printed, so everything arrives the way a sheet passes under a drum. A word or a shape is uncovered from
// its top edge downward with a quick ease and settles a hair downward as the ink lands; it leaves the same way it came, the clip
// closing from the top, as if the sheet fed on. Nothing fades, bounces or spins. Colours are two inks on paper.
import { clamp, ease, mix, contrast, rng } from '/engine/kit.js';

export const E = ease.outQuart;

const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const c = rgbOf(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export { rgbOf };

// The two drums and the paper. Paper is the brand's lighter colour, the first drum its darker one, the second drum its accent.
// `on` is whichever of paper and ink reads better on the accent: text on an accent fill is always set in it.
// `soft` is the lightest ink tint that still reads on paper at 4.5:1.
export function palette(brand, look) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, ink = paper === text ? bg : text;
  const on = contrast(ink, accent) >= contrast(paper, accent) ? ink : paper;
  let k = look.tokens.tone.soft, soft = mix(paper, ink, k);
  while (contrast(soft, paper) < 4.6 && k < 1) { k = Math.min(1, k + 0.04); soft = mix(paper, ink, k); }
  return { paper, ink, accent, on, soft };
}

// A word (or any box) is printed in from its top. box: { x, y (middle), width }, size: the font size.
export function arrive(ctx, p, box, size) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const h = size * 1.8, q = E(p);
  ctx.beginPath(); ctx.rect(box.x - size * 0.45, box.y - h / 2, box.width + size * 0.9, h * q); ctx.clip();
  ctx.translate(0, -(1 - q) * size * 0.16);
}
export function leave(ctx, p, box, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const h = size * 1.8, q = ease.inQuad(p);
  ctx.beginPath(); ctx.rect(box.x - size * 0.45, box.y - h / 2 + h * q, box.width + size * 0.9, h * (1 - q)); ctx.clip();
}
// An area printed in (p 0..1, clip grows from the top) and fed out (q 0..1, clip shrinks from the top). Returns false when nothing shows.
export function feed(ctx, p, q, x, y, w, h) {
  if (p <= 0 || q >= 1) return false;
  const a = E(p), b = ease.inQuad(q);
  ctx.beginPath(); ctx.rect(x, y + h * b, w, h * (a - b)); ctx.clip();
}

// A patch of ink with soft, slightly uneven edges, as a riso fill lands: a rectangle whose edges wander by a pixel or three.
export function blob(ctx, x, y, w, h, seed, fill) {
  const r = rng(seed), j = () => (r() - 0.5) * 5, n = Math.max(3, Math.round(w / 44)), m = Math.max(2, Math.round(h / 44));
  ctx.beginPath(); ctx.moveTo(x + j(), y + j());
  for (let i = 1; i <= n; i++) ctx.lineTo(x + (w * i) / n + j(), y + j());
  for (let i = 1; i <= m; i++) ctx.lineTo(x + w + j(), y + (h * i) / m + j());
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(x + (w * i) / n + j(), y + h + j());
  for (let i = m - 1; i > 0; i--) ctx.lineTo(x + j(), y + (h * i) / m + j());
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
export function disc(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

// Run `draw` with the second drum: multiplied onto what is under it and shifted by the sheet's registration error.
export function overprint(ctx, reg, draw) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.translate(reg.x, reg.y); draw(); ctx.restore();
}
