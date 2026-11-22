// Bauhaus motion: things have mass. A shape slides or rolls in along a straight path and lands with one small heavy overshoot, a
// square turns its last quarter as it lands, a triangle its last third. Words are set solid: each slides into its own slot from the
// reading side, as type pushed into a chase, and leaves by sliding on out the other side. Nothing fades or blurs.
import { clamp, ease, mix, contrast } from '/engine/kit.js';

// A heavy ease: arrives fast, swings about 4% past and settles exactly on 1.
export const heavy = (p) => { p = clamp(p); return p >= 1 ? 1 : 1 - (1 - p) ** 3 * Math.cos(p * Math.PI * 1.25); };
export const E = ease.outQuart;

const lum = (h) => { const n = parseInt(h.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

// paper: the brand's lighter colour; ink: its darker; accent; mid: ink and accent mixed, the third primary of the composition.
// on: whichever of paper and ink reads better on the accent. soft: the lightest ink tint that reads on paper at 4.5:1.
export function palette(brand, look) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, ink = paper === text ? bg : text;
  const on = contrast(ink, accent) >= contrast(paper, accent) ? ink : paper;
  let k = look.tokens.tone.soft, soft = mix(paper, ink, k);
  while (contrast(soft, paper) < 4.6 && k < 1) { k = Math.min(1, k + 0.04); soft = mix(paper, ink, k); }
  return { paper, ink, accent, on, soft, mid: mix(ink, accent, look.tokens.tone.mid) };
}

// A word slides into its slot from the reading side. dir: +1 when the reading side is the right.
export function arrive(ctx, p, box, size, dir = 1) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const h = size * 1.7;
  ctx.beginPath(); ctx.rect(box.x - size * 0.2, box.y - h / 2, box.width + size * 0.4, h); ctx.clip();
  ctx.translate(dir * (1 - heavy(p)) * (box.width + size * 0.4), 0);
}
export function leave(ctx, p, box, size, dir = 1) {
  if (p >= 1) return false;
  if (p <= 0) return;
  const h = size * 1.7;
  ctx.beginPath(); ctx.rect(box.x - size * 0.2, box.y - h / 2, box.width + size * 0.4, h); ctx.clip();
  ctx.translate(-dir * ease.inQuad(p) * (box.width + size * 0.4), 0);
}

// ---- the shapes. Each draws at its landed place; `p` (0..1) brings it in from `from` (an offset) with its last turn.
const travel = (ctx, p, from, turn, cx, cy) => {
  const q = heavy(p);
  ctx.translate(from.x * (1 - q), from.y * (1 - q));
  if (turn) { ctx.translate(cx, cy); ctx.rotate(turn * (1 - q)); ctx.translate(-cx, -cy); }
};
export function circle(ctx, p, cx, cy, r, fill, from = { x: 0, y: 0 }) {
  if (p <= 0) return; ctx.save(); travel(ctx, p, from, 0, cx, cy);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}
export function square(ctx, p, cx, cy, s, fill, from = { x: 0, y: 0 }, angle = 0) {
  if (p <= 0) return; ctx.save(); travel(ctx, p, from, Math.PI / 2, cx, cy);
  ctx.translate(cx, cy); ctx.rotate(angle); ctx.fillStyle = fill; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
}
// An equilateral triangle of side s around its centre, pointing `angle` (0 = up).
export function triangle(ctx, p, cx, cy, s, fill, from = { x: 0, y: 0 }, angle = 0) {
  if (p <= 0) return; ctx.save(); travel(ctx, p, from, (Math.PI * 2) / 3, cx, cy);
  ctx.translate(cx, cy); ctx.rotate(angle); const h = (s * Math.sqrt(3)) / 2;
  ctx.beginPath(); ctx.moveTo(0, -h * 2 / 3); ctx.lineTo(s / 2, h / 3); ctx.lineTo(-s / 2, h / 3); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}
// A thick bar from a to b, drawn out along its length by p.
export function bar(ctx, p, ax, ay, bx, by, thick, fill) {
  if (p <= 0) return; const q = E(p), ex = ax + (bx - ax) * q, ey = ay + (by - ay) * q;
  ctx.save(); ctx.strokeStyle = fill; ctx.lineWidth = thick; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore();
}
