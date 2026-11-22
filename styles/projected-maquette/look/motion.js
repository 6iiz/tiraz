// Projected Maquette motion: a dark room, a white massing model, a projector. Words are not animated in: they are switched on like a
// projected slide (a short strike, a dim first flash, then the image comes up and pulls into focus), and switched off with a quick
// staggered cut when the layer changes. Data never moves the model; it arrives as light on it, one layer per scene, each with its own
// gesture (a wash across the table, districts popping on, a level rising up the facades, a sweep that recolours the table).
import { clamp, mix, rgba, contrast } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const soft = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

// The room is the darker brand colour, the model the lighter one ("white"), the projector throws the accent.
export function palette(brand, T) {
  const a = brand.colors.bg, b = brand.colors.text, dark = lum(a) <= lum(b) ? a : b, light = dark === a ? b : a;
  let key = brand.colors.accent, k = 0;
  while (contrast(key, dark) < 4 && k < 1) { k += 0.08; key = mix(brand.colors.accent, light, k); }
  return { dark, light, accent: brand.colors.accent, key, beam: mix(brand.colors.accent, light, 0.22), grey: mix(dark, light, T.tone.grey), dimText: mix(dark, light, T.tone.dim) };
}

export function layout(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = kit.rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, index: index++ });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// Consecutive key words on a row become one run: one projected highlight (and at most one pin) per phrase.
export function runs(words) {
  const out = [];
  for (const w of words) {
    const last = out.at(-1);
    if (w.key && last && last.row === w.row && last.last === w.index - 1) { last.x0 = Math.min(last.x0, w.x); last.x1 = Math.max(last.x1, w.x + w.width); last.last = w.index; }
    else if (w.key) out.push({ x0: w.x, x1: w.x + w.width, y: w.y, row: w.row, first: w.index, last: w.index });
  }
  return out;
}

// A projected word, inside kit.drawText's `each`: p runs 0..1 over the strike; out runs 0..1 over the switch-off.
// Returns false when the word is dark, or the colour to draw it in.
export function strike(ctx, p, out, color, dark, size, glow) {
  if (p <= 0 || out >= 1) return false;
  if (p < 0.16 || (p > 0.3 && p < 0.4)) return false;                       // the lamp catches: on, off, on
  const up = p < 0.3 ? 0.45 : 0.55 + 0.45 * E((p - 0.4) / 0.6);
  const blur = (1 - E((p - 0.3) / 0.7)) * size * 0.06;
  if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = size * 0.3 * up; }
  return mix(dark, color, up);
}
