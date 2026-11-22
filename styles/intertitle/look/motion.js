// Intertitle motion: everything is hand-cranked. Time is read in drawings (12 a second), so a card opens, a line is exposed or a number
// climbs in visible steps, never in a smooth glide. A card opens like a projector shutter (from its middle outward); words are exposed whole,
// in a few steps of light, with a short settling drop; a key word gets a drawn flourish under it. Scenes join by the iris (joint.js).
// This file also holds what the parts share: the palette, the card frame, the ornament rule, the flourish and the strike.
import { clamp, mix, contrast, rgba } from '/engine/kit.js';

export const crank = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;          // time read in whole drawings
export const lighter = (a, b) => contrast(a, '#000000') >= contrast(b, '#000000');

// Colours: the print is always dark (the brand's darker colour), the writing is the brand's lighter colour with a breath of the accent
// in it (the print's tint). The accent writes a key word only when it reads on the card; otherwise the key word stays silver and keeps
// its flourish, which is always the accent.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lighter(bg, text) ? bg : text, dark = light === bg ? text : bg;
  const silver = mix(light, accent, 0.05), card = mix(dark, light, 0.075);
  let k = 0.42, dim = mix(silver, card, k);
  while (k > 0 && contrast(dim, card) < 4.5) { k -= 0.04; dim = mix(silver, card, Math.max(0, k)); }
  // a tint of the accent lifted toward the light colour until it reads on the card: the accent itself when it already does
  const lift = (min) => { let q = 0, c = accent; while (q < 1 && contrast(c, card) < min) { q += 0.05; c = mix(accent, light, q); } return c; };
  return {
    light, dark, accent, silver, card, dim,
    house: mix(dark, '#000000', 0.5),
    velvet: mix(mix(dark, accent, 0.32), '#000000', 0.4),
    key: lift(4.5),
    flourish: lift(3),
  };
}

// Exposure of a whole word or block: p (0..1, already cranked) -> alpha and a small drop.
export function expose(c, p, size) {
  if (p <= 0) return false;
  c.globalAlpha *= clamp(p * 1.35);
  c.translate(0, (1 - clamp(p)) * size * 0.12);
}

// The card: a dark plate with a concave-cornered outer rule, a thin inner rule, small diamonds at the inner corners and a lozenge at the
// top and bottom centre. p opens it from the middle outward (a shutter), in drawings.
function frame(ctx, x0, y0, x1, y1, r) {
  ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.lineTo(x1 - r, y0); ctx.arc(x1, y0, r, Math.PI, Math.PI / 2, true);
  ctx.lineTo(x1, y1 - r); ctx.arc(x1, y1, r, 1.5 * Math.PI, Math.PI, true); ctx.lineTo(x0 + r, y1);
  ctx.arc(x0, y1, r, 0, -Math.PI / 2, true); ctx.lineTo(x0, y0 + r); ctx.arc(x0, y0, r, Math.PI / 2, 0, true); ctx.closePath();
}
export function diamond(ctx, x, y, s, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function card(ctx, x0, y0, x1, y1, p, P, notch = 26) {
  if (p <= 0) return;
  const cx = (x0 + x1) / 2, half = ((x1 - x0) / 2 + 8) * clamp(p);
  ctx.save(); ctx.beginPath(); ctx.rect(cx - half, y0 - 10, half * 2, y1 - y0 + 20); ctx.clip();
  frame(ctx, x0, y0, x1, y1, notch); ctx.fillStyle = rgba(P.card, 0.92); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = P.silver; ctx.stroke();
  const i = 16; ctx.lineWidth = 1.4; ctx.strokeRect(x0 + i, y0 + i, x1 - x0 - 2 * i, y1 - y0 - 2 * i);
  for (const [x, y] of [[x0 + i, y0 + i], [x1 - i, y0 + i], [x0 + i, y1 - i], [x1 - i, y1 - i]]) diamond(ctx, x, y, 6, P.silver);
  for (const y of [y0 + i, y1 - i]) { diamond(ctx, cx, y, 11, P.card, P.silver); diamond(ctx, cx, y, 4, P.silver); }
  ctx.restore();
}

// An ornament rule: two hairlines from a centre lozenge, with a dot at each end. p draws it out from the centre.
export function rule(ctx, cx, y, w, p, P) {
  if (p <= 0) return;
  const l = (w / 2 - 22) * clamp(p);
  ctx.save(); ctx.strokeStyle = P.dim; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(cx - 22, y); ctx.lineTo(cx - 22 - l, y); ctx.moveTo(cx + 22, y); ctx.lineTo(cx + 22 + l, y); ctx.stroke();
  ctx.fillStyle = P.dim; ctx.beginPath(); ctx.arc(cx - 22 - l, y, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 22 + l, y, 3, 0, 7); ctx.fill();
  diamond(ctx, cx, y, 8, P.flourish); diamond(ctx, cx, y, 3, P.card);
  ctx.restore();
}

// The flourish under a key word: a swash drawn from the reading side, curling into a small hook at its end. p draws it on.
export function flourish(ctx, x0, x1, y, p, P, rtl = true) {
  if (p <= 0) return;
  const w = x1 - x0, s = rtl ? -1 : 1, a = rtl ? x1 : x0, b = rtl ? x0 : x1;
  ctx.save(); ctx.strokeStyle = P.flourish; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a - s * 6, y - 4);
  ctx.bezierCurveTo(a + s * w * 0.3, y + 10, a + s * w * 0.6, y - 8, b + s * 2, y + 2);
  ctx.bezierCurveTo(b + s * 14, y + 6, b + s * 16, y - 12, b + s * 4, y - 10);
  ctx.setLineDash([(w + 80) * clamp(p), w + 200]); ctx.stroke();
  ctx.restore();
}

// A strike scratched across the old value: a slightly wavering line from the reading side. p draws it.
export function strike(ctx, x0, x1, y, p, P, rtl = true) {
  if (p <= 0) return;
  const L = (x1 - x0 + 40) * clamp(p), from = rtl ? x1 + 20 : x0 - 20, s = rtl ? -1 : 1;
  ctx.save(); ctx.strokeStyle = P.flourish; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(from, y + 6);
  for (let d = 0; d <= L; d += 24) ctx.lineTo(from + s * d, y + 6 - d * 0.035 + Math.sin(d * 0.09) * 2.5);
  ctx.stroke(); ctx.restore();
}

// Wrapped text with even rows (a long line is narrowed until one more step would add a row).
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 16; w > o.maxW * 0.45; w -= 16) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
