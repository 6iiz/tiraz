// Swiss motion: two curves only. A precise ease for anything that snaps, linear for anything that is drawn along its length.
// Things never fade, bounce or fly: they rise out of a clip below their baseline, leave upward, or are cut by a knife and fold flat.
import { clamp } from '/engine/kit.js';

function bezier(x1, y1, x2, y2) {
  const bx = (u) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  return (t) => { t = clamp(t); if (t <= 0 || t >= 1) return t; let lo = 0, hi = 1, u = t;
    for (let i = 0; i < 28; i++) { const x = bx(u); if (Math.abs(x - t) < 1e-6) break; if (x < t) lo = u; else hi = u; u = (lo + hi) / 2; } return by(u); };
}
export const E = bezier(0.7, 0, 0.2, 1);
// Climb to a value in n eased steps ("one module at a time").
export const steps = (p, n = 4) => { p = clamp(p) * n; const i = Math.floor(p); return i >= n ? 1 : (i + E(p - i)) / n; };

// A word (or any box) rises out of a clip whose floor is its baseline. box: { x, y (middle), width }, size: the font size.
export function arrive(ctx, p, box, size) {
  if (p <= 0) return false;
  const h = size * 1.5;
  ctx.beginPath(); ctx.rect(box.x - 8, box.y - h / 2, box.width + 16, h); ctx.clip();
  ctx.translate(0, (1 - E(p)) * h * 0.8);
}
export function leave(ctx, p, box, size) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const h = size * 1.5;
  ctx.beginPath(); ctx.rect(box.x - 8, box.y - h / 2, box.width + 16, h); ctx.clip();
  ctx.translate(0, -E(p) * h * 0.8);
}
// The knife: a 2 px line crosses from the reading side (first 1/3 of p), then the thing folds flat onto its midline (the rest).
// Call it around the drawing of the thing; returns false when nothing is left to draw.
export function knife(ctx, p, x0, x1, ymid, ink, rtl = true, draw) {
  if (p <= 0) { draw(); return; }
  const pl = clamp(p * 3), pf = E(clamp((p - 1 / 3) * 1.5));
  if (pf < 1) { ctx.save(); ctx.translate(0, ymid); ctx.scale(1, 1 - pf); ctx.translate(0, -ymid); draw(); ctx.restore(); }
  if (pl > 0 && pf < 1) { const w = (x1 - x0) * pl; ctx.fillStyle = ink; ctx.fillRect(rtl ? x1 - w : x0, ymid - 1, w, 2); }
}
