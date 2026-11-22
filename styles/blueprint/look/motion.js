// Blueprint motion: everything is drawn by a pen, in drafting order. A line grows along its length at an even pace, a box is traced
// round its perimeter, a circle is swung like a compass. A word is plotted: a hairline pen crosses it from the reading side and the
// word is uncovered behind the pen; it leaves the same way, erased from the reading side. Nothing fades, flies or bounces.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const plot = ease.inOutQuad;           // a pen speeds up and slows down a little at each end of a stroke
export const E = ease.outCubic;

// The two inks of the sheet, whatever order the brand gave them in: the darker colour is the sheet, the lighter one the line work.
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export function inks(brand, tone) {
  const { bg, text, accent } = brand.colors;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const sheet = mix(dark, light, tone.sheet);
  // the accent is a pen colour; as the colour of words it is used only when it reads at 4.5:1 on the sheet
  return { dark, light, sheet, accent, dim: mix(light, sheet, tone.dim), key: contrast(accent, sheet) >= 4.5 ? accent : light };
}

// A word (or any box) is uncovered behind a 2 px pen that crosses it from the reading side. box: { x, y (middle), width }.
export function arrive(ctx, p, box, size, rtl = true, pen) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const h = size * 1.7, w = box.width + 16, r = w * plot(p);
  const x = rtl ? box.x + box.width + 8 - r : box.x - 8;
  if (pen) { const f = ctx.fillStyle; ctx.fillStyle = pen; ctx.fillRect(rtl ? x - 2 : x + r, box.y - h / 2, 2, h); ctx.fillStyle = f; }
  ctx.beginPath(); ctx.rect(x, box.y - h / 2, r, h); ctx.clip();
}
// Erased from the reading side: what is left is the trailing part.
export function leave(ctx, p, box, size, rtl = true) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const h = size * 1.7, w = box.width + 16, r = w * (1 - plot(p));
  const x = rtl ? box.x - 8 : box.x + box.width + 8 - r;
  ctx.beginPath(); ctx.rect(x, box.y - h / 2, r, h); ctx.clip();
}

// ---- pen strokes: each draws with the ctx's current strokeStyle and lineWidth, grown to p (0..1) along its length ----
export function poly(ctx, pts, p) {
  p = clamp(p); if (p <= 0 || pts.length < 2) return;
  const seg = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  let left = total * p;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const k = Math.min(1, left / (seg[i - 1] || 1)), a = pts[i - 1], b = pts[i];
    ctx.lineTo(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k); left -= seg[i - 1];
  }
  ctx.stroke();
}
export const seg = (ctx, x0, y0, x1, y1, p) => poly(ctx, [[x0, y0], [x1, y1]], p);
// A box traced round its perimeter, starting at the top corner on the reading side.
export function rect(ctx, x, y, w, h, p, rtl = true) {
  const pts = rtl ? [[x + w, y], [x, y], [x, y + h], [x + w, y + h], [x + w, y]] : [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  poly(ctx, pts, p);
}
// A compass swing from twelve o'clock, against the reading direction like a hand-drawn circle.
export function circle(ctx, x, y, r, p, rtl = true) {
  p = clamp(p); if (p <= 0) return;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + (rtl ? -1 : 1) * p * Math.PI * 2, rtl); ctx.stroke();
}
// A dimension line between x0 and x1 at height y: it grows out from its middle, then the architect's 45-degree ticks are struck at
// both ends. ext: the length of the extension lines (negative reaches up, positive down), drawn first.
export function dim(ctx, x0, x1, y, p, ext = 0, tick = 14) {
  p = clamp(p); if (p <= 0) return;
  const pe = clamp(p * 3), pl = plot(clamp((p - 0.2) / 0.65)), pt = clamp((p - 0.85) / 0.15);
  if (ext) { seg(ctx, x0, y - ext, x0, y + Math.sign(ext) * 10, pe); seg(ctx, x1, y - ext, x1, y + Math.sign(ext) * 10, pe); }
  const m = (x0 + x1) / 2, hw = ((x1 - x0) / 2 + 12) * pl;
  if (pl > 0) seg(ctx, m - hw, y, m + hw, y, 1);
  if (pt > 0) for (const x of [x0, x1]) seg(ctx, x - tick / 2, y + tick / 2, x + tick / 2, y - tick / 2, pt);
}
// Same, standing up: from y0 to y1 at x.
export function vdim(ctx, x, y0, y1, p, ext = 0, tick = 14) {
  ctx.save(); ctx.translate(x, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); dim(ctx, -(y1 - y0) / 2, (y1 - y0) / 2, 0, p, ext, tick); ctx.restore();
}
// A centre line: long dash, short dash.
export function centre(ctx, x0, y0, x1, y1, p) { ctx.save(); ctx.setLineDash([30, 8, 6, 8]); seg(ctx, x0, y0, x1, y1, p); ctx.restore(); }

// Where each word of a fitted text will stand, measured once in create() so lines and balloons can be placed around it.
export function boxes(kit, f, o) {
  const out = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, each: (w, i, b) => { out.push({ ...b, key: w.key, i }); return false; } });
  return out;
}
