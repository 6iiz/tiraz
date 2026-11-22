// Poster motion: everything arrives on a diagonal, fast, and stops dead (an exponential slam, no bounce, no fade-through). Bands are
// thrown in along their own length; whole blocks of words slide in up-and-across, never letter by letter. Things leave the same way
// they came, down the diagonal. This file also holds what the poster parts share: the palette, a band, a wedge, a rotated block.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outExpo;                       // the slam
export const I = ease.inQuad;                        // a throw out
export const rad = (deg) => (deg * Math.PI) / 180;

// Colours: the brand's ground, its text colour as the "paper" of light bands, its accent as the red of the poster.
// What sits on each fill is chosen by contrast, so a light-ground brand works the same way.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const on = (fill) => (contrast(fill, bg) >= contrast(fill, text) ? bg : text);
  const readable = (fg, k, against = bg) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < 4.5) { k -= 0.04; c = mix(fg, against, Math.max(0, k)); } return c; };
  const panel = mix(bg, text, T.tone.panel);
  return {
    bg, text, accent, on, readable, panel,
    paper: text, onPaper: on(text), onAccent: on(accent), onPanel: on(panel),
    keyText: contrast(accent, bg) >= 4.5 ? accent : text,
    muted: readable(text, 0.3),
    ray: mix(bg, text, T.tone.ray),
    wedge: mix(bg, accent, T.tone.wedge),
  };
}

// A straight band centred on (cx, cy), `len` long and `thick` thick, turned by `deg`. p: how much of its length is out, from its
// start end (dir 1) or its far end (dir -1).
export function band(ctx, cx, cy, len, thick, deg, color, p = 1, dir = 1) {
  const q = clamp(p); if (q <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rad(deg)); ctx.fillStyle = color;
  const l = len * q; ctx.fillRect(dir > 0 ? -len / 2 : len / 2 - l, -thick / 2, l, thick);
  ctx.restore();
}
// A wedge (a slice of a circle) from (x, y) between two angles in degrees, `r` long.
export function wedge(ctx, x, y, a0, a1, r, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, rad(a0), rad(a1)); ctx.closePath(); ctx.fill();
}
// Runs draw() with the canvas turned by `deg` around (cx, cy) and thrown in along the diagonal: p = 0 is far off, 1 is home.
// The whole block turns and moves as one, so the words inside stay set as they were fitted. draw(off) gets how far (px) the block still
// is from home: words inside are printed only when it is near (off < SETTLE), so they appear stamped on landing and never fly off frame.
export const SETTLE = 40;
export function block(ctx, cx, cy, deg, p, out, draw, reach = 900) {
  if (p <= 0 || out >= 1) return;
  const e = E(p), o = I(out), k = (1 - e) - o;
  ctx.save(); ctx.translate(cx + k * reach, cy - k * reach * 0.42); ctx.rotate(rad(deg)); draw(Math.abs(k * reach)); ctx.restore();
}

// A word slides up-and-across into place and stops. Used when words arrive one at a time on a horizontal fill.
export function arrive(ctx, p, box, size) {
  if (p <= 0) return false;
  const e = E(p); ctx.globalAlpha *= clamp(p * 3); ctx.translate((1 - e) * size * 1.4, (1 - e) * size * 0.6);
}
export function leave(ctx, p, box, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const e = I(p); ctx.globalAlpha *= 1 - clamp(p * 1.5); ctx.translate(-e * size * 1.4, e * size * 0.6);
}

// Wrapped text with even rows: once a text needs several rows, the box is narrowed (same size) until one more step would add a row.
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
