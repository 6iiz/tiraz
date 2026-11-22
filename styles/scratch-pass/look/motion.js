// Scratch-pass motion: one unbroken camera move. The print never cuts; the camera travels sideways through layered planes of a scratchboard
// landscape for the whole reel (ground.js reads the reel's clock), and scenes are joined by a near post passing in front of the lens.
// Words sit on paper slips carved out of the ink: a slip appears as parallel knife cuts that run out from the reading side and then widen
// until they close into clean paper (tone made by the width of the cuts). Words then slide a short way along the direction of travel and
// settle. A key word gets the one red, and a tapered knife stroke under it. This file holds the palette and the shared marks.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

export const E = ease.outCubic;
export const lighter = (a, b) => contrast(a, '#000000') >= contrast(b, '#000000');

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = lighter(bg, text) ? bg : text, ink = paper === bg ? text : bg;
  const red = accent;
  let k = 0.4, grey = mix(ink, paper, k); while (k > 0 && contrast(grey, paper) < 4.5) { k -= 0.04; grey = mix(ink, paper, Math.max(0, k)); }
  return { paper, ink, red, grey, key: contrast(red, paper) >= 3 ? red : ink, mid: mix(paper, ink, 0.5) };
}

// A paper slip carved out of the ink. p 0..1: the cuts run out from the reading side (first 45 %), then widen until they close.
export function carve(ctx, x0, y0, x1, y1, p, P, { pitch = 8, rtl = true, frame = true } = {}) {
  if (p <= 0) return;
  const run = E(clamp(p / 0.45)), widen = E(clamp((p - 0.35) / 0.65)), rows = Math.ceil((y1 - y0) / pitch);
  ctx.save();
  const iw = (x1 - x0 + 12) * Math.min(1, run * 1.3);                   // the ink bed the slip is cut from, opening from the reading side
  ctx.fillStyle = P.ink; ctx.fillRect(rtl ? x1 + 6 - iw : x0 - 6, y0 - 6, iw, y1 - y0 + 12);
  ctx.fillStyle = P.paper;
  for (let i = 0; i < rows; i++) {
    const lag = (i % 3) * 0.04 + (i % 7) * 0.012, L = (x1 - x0) * clamp((run - lag) / (1 - lag));
    if (L <= 0) continue;
    const h = Math.min(pitch, 1.2 + (pitch - 1.2) * widen), y = y0 + i * pitch + (pitch - h) / 2;
    ctx.fillRect(rtl ? x1 - L : x0, y, L, Math.min(h, y1 - y));
  }
  if (frame && widen >= 1) { ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(x0 + 9, y0 + 9, x1 - x0 - 18, y1 - y0 - 18); }
  ctx.restore();
}

// A knife stroke: blunt entry on the reading side, tapered exit. p cuts it along its length.
export function knife(ctx, x0, x1, y, w, color, p = 1, rtl = true) {
  if (p <= 0) return;
  const L = (x1 - x0) * clamp(p), a = rtl ? x1 : x0, s = rtl ? -1 : 1;
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(a, y - w / 2); ctx.lineTo(a + s * L * 0.7, y - w * 0.35); ctx.lineTo(a + s * L, y + w * 0.1); ctx.lineTo(a + s * L * 0.7, y + w * 0.4); ctx.lineTo(a, y + w / 2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// A word slides in along the direction of travel (from the reading side) and settles; it fades in only over its first fifth.
export function arrive(c, p, size, rtl = true) {
  if (p <= 0) return false;
  c.globalAlpha *= clamp(p * 3);
  c.translate((rtl ? -1 : 1) * -(1 - E(p)) * size * 0.3, 0);
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
