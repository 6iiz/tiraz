// Keynote motion: things snap. One curve (an exponential ease-out) does nearly all the work: a word or a card rises a short way and
// lands exactly, with no overshoot. Light does the rest: a soft band sweeps across from the reading side and what it passes turns from
// unlit to lit. Leaving is quick: a short lift and a fade, so the next thing has the stage.
import { clamp, ease, mix, rgba, rr, contrast } from '/engine/kit.js';

export const E = ease.outExpo;
export const S = ease.inOutCubic;

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
// The stage is the brand's darker colour, the light is the lighter one; three surfaces step up from the stage.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const [s1, s2, s3] = T.surface.map((k) => mix(dark, light, k));
  return { dark, light, accent, s1, s2, s3, border: rgba(light, T.tone.border), grid: rgba(light, T.tone.grid),
    dim: mix(light, dark, T.tone.dim), keyOk: contrast(accent, dark) >= 4.5, key: contrast(accent, dark) >= 4.5 ? accent : light,
    // the key colour for words that stand on a given surface: the accent only where it reads at 4.5:1 there
    keyOn: (surface) => (contrast(accent, surface) >= 4.5 ? accent : light) };
}

// A word or box arrives: a quick fade-in while it rises a third of its size and lands. box: { x, y (middle), width }.
export function arrive(ctx, p, box, size) {
  if (p <= 0) return false;
  if (p >= 1) return;
  ctx.globalAlpha *= clamp(p * 3);
  ctx.translate(0, (1 - E(p)) * size * 0.34);
}
export function leave(ctx, p, box, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  ctx.globalAlpha *= 1 - S(p);
  ctx.translate(0, -S(p) * size * 0.2);
}
// How lit a point is while the light band crosses [x0, x1] from the reading side: 0 before the band reaches it, 1 after.
export function lit(q, x, x0, x1, rtl = true, soft = 0.35) {
  const u = rtl ? (x1 - x) / (x1 - x0 || 1) : (x - x0) / (x1 - x0 || 1);
  return clamp((q * (1 + soft) - u) / soft);
}
// A colour between its unlit and lit state.
export const glowOf = (pal, colour, k, T) => mix(mix(colour, pal.dark, T.tone.unlit), colour, k);

// A panel: a rounded rectangle on one of the three surfaces with a 1 px border. p (0..1) lets it snap in from 97% scale.
export function card(ctx, x, y, w, h, r, fill, border, p = 1) {
  if (p <= 0) return;
  ctx.save();
  if (p < 1) { const s = 0.97 + 0.03 * E(p), cx = x + w / 2, cy = y + h / 2; ctx.globalAlpha *= clamp(p * 2.5); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = border; rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.stroke();
  ctx.restore();
}
// The light sweep across a panel: a soft diagonal band of light inside its rounded edge, and its border catching the light.
export function sheen(ctx, x, y, w, h, r, q, light, rtl = true, strength = 1) {
  if (q <= 0 || q >= 1) return;
  const band = w * 0.45, pos = rtl ? x + w + band - (w + 2 * band) * S(q) : x - band + (w + 2 * band) * S(q);
  const g = ctx.createLinearGradient(pos - band, y, pos + band, y + h * 0.3);
  g.addColorStop(0, rgba(light, 0)); g.addColorStop(0.5, rgba(light, 0.09 * strength)); g.addColorStop(1, rgba(light, 0));
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const gb = ctx.createLinearGradient(pos - band, y, pos + band, y);
  gb.addColorStop(0, rgba(light, 0)); gb.addColorStop(0.5, rgba(light, 0.55 * strength)); gb.addColorStop(1, rgba(light, 0));
  ctx.restore();
  ctx.save(); ctx.lineWidth = 1.5; ctx.strokeStyle = gb; rr(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r); ctx.stroke(); ctx.restore();
}
// A soft pool of light, drawn once to its own canvas and laid down wherever it is needed.
export function pool(colour, w, h, a) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g2 = c.getContext('2d');
  g2.translate(w / 2, h / 2); g2.scale(1, h / w);
  const g = g2.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  g.addColorStop(0, rgba(colour, a)); g.addColorStop(0.45, rgba(colour, a * 0.45)); g.addColorStop(1, rgba(colour, 0));
  g2.fillStyle = g; g2.beginPath(); g2.arc(0, 0, w / 2, 0, Math.PI * 2); g2.fill();
  return c;
}
// The visible beam of the sweep: a tall soft band of light that crosses the stage from the reading side, slightly slanted.
export function beam(ctx, W, H, q, light, rtl = true, a = 0.06) {
  if (q <= 0 || q >= 1) return;
  const band = 260, x = rtl ? W + band - (W + 2 * band) * S(q) : -band + (W + 2 * band) * S(q);
  const g = ctx.createLinearGradient(x - band, 0, x + band, H * 0.12);
  g.addColorStop(0, rgba(light, 0)); g.addColorStop(0.5, rgba(light, a * Math.sin(Math.PI * q))); g.addColorStop(1, rgba(light, 0));
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
