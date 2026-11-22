// Data motion: precise and editorial. Words slide in a short way from the reading side as they become solid; lines and bars are drawn
// along their length (axes first, then the data, then the note on it); values count to their true number and stop. Nothing bounces.
// This file also holds what every part of this style shares: the palette, a rule that draws itself, a leader with a dot, even wrapping.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outQuart;                       // arrivals
export const D = ease.inOutCubic;                     // anything drawn along its length

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const readable = (fg, k, against = bg) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < 4.5) { k -= 0.04; c = mix(fg, against, Math.max(0, k)); } return c; };
  return {
    bg, text, accent, readable,
    keyText: contrast(accent, bg) >= 4.5 ? accent : text,
    onAccent: contrast(accent, bg) >= contrast(accent, text) ? bg : text,
    muted: readable(text, T.tone.muted),
    grid: mix(bg, text, T.tone.grid),
    axis: mix(bg, text, T.tone.axis),
    track: mix(bg, text, T.tone.track),
    series: mix(bg, text, T.tone.series),
  };
}

// A horizontal rule from x0 to x1 drawn from the reading side to fraction p. rtl: grows right to left.
export function rule(ctx, x0, x1, y, p, color, w = 2, rtl = true) {
  const len = (x1 - x0) * clamp(p); if (len <= 0) return;
  ctx.fillStyle = color; ctx.fillRect(rtl ? x1 - len : x0, y - w / 2, len, w);
}
// Small ticks hanging under a rule, every `step` px, appearing with the rule.
export function ticks(ctx, x0, x1, y, step, p, color, rtl = true, h = 10) {
  ctx.fillStyle = color;
  for (let x = rtl ? x1 : x0; rtl ? x >= x0 : x <= x1; x += rtl ? -step : step) {
    const k = Math.abs(x - (rtl ? x1 : x0)) / (x1 - x0); if (k > clamp(p)) break;
    ctx.fillRect(x - 1, y, 2, h);
  }
}
// A leader line from a to b drawn to fraction p, with a ring at the start and a dot at the end once it arrives.
export function leader(ctx, a, b, p, color, w = 2) {
  if (p <= 0) return;
  const q = clamp(p), x = a[0] + (b[0] - a[0]) * q, y = a[1] + (b[1] - a[1]) * q;
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.arc(a[0], a[1], 7, 0, Math.PI * 2); ctx.stroke();
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  ctx.beginPath(); ctx.moveTo(a[0] + dx / L * 7, a[1] + dy / L * 7); ctx.lineTo(x, y); ctx.stroke();
  if (q >= 1) { ctx.beginPath(); ctx.arc(b[0], b[1], 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// A word (or a box) slides a short way in from the reading side and becomes solid. rtl: the reading side is the right.
export function arrive(ctx, p, box, size, rtl = true) {
  if (p <= 0) return false;
  const e = E(p); ctx.globalAlpha *= e; ctx.translate((rtl ? 1 : -1) * (1 - e) * size * 0.4, 0);
}
export function leave(ctx, p, box, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  ctx.globalAlpha *= 1 - D(p);
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
