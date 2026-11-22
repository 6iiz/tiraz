// Felt-tip motion: one sheet, one thick marker, nothing but strokes. Every mark is drawn along its length at the speed of a hand; a
// word is lettered the way people letter with a marker: its outline is traced first, then it is coloured in from the reading side.
// Ink is ink: marks are laid in multiply, so where two strokes cross the paper is visibly darker, and a stroke never darkens itself.
// Nothing on a sheet leaves: when a sheet is done, the whole sheet is peeled away (joint.js). This file also holds what the parts share:
// the palette, the marker stroke, a hand-drawn segment, the colouring-in fill, and the lettering.
import { clamp, ease, mix, contrast, rng, lerp } from '/engine/kit.js';

// Colours. The lighter brand colour is the paper, the darker one the black marker, the accent the coloured marker (taken toward the
// black marker until it shows on the paper). Marks are multiplied onto the paper, so a light accent still darkens what it crosses.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, ink = paper === bg ? text : bg;
  let pen = accent, k = 0; while (contrast(pen, paper) < 2.4 && k < 0.7) { k += 0.05; pen = mix(accent, ink, k); }
  return { paper, ink, pen, grey: mix(ink, paper, 0.38), back: mix(paper, ink, 0.07), strip: mix(paper, ink, 0.12) };
}

// A marker stroke along pts, drawn to fraction p of its length: a thick round-nibbed line with a denser touch-down where it starts.
export function marker(ctx, pts, p, color, w = 10, alpha = 1) {
  if (p <= 0 || pts.length < 2) return;
  let total = 0; const L = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(total); }
  const end = total * clamp(p);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= end) ctx.lineTo(pts[i][0], pts[i][1]);
    else { const f = (end - L[i - 1]) / (L[i] - L[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); break; }
  }
  ctx.stroke();
  ctx.globalAlpha = 0.35 * alpha; ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], w * 0.42, 0, 6.29); ctx.fill();   // the touch-down
  ctx.restore();
}
// A hand-drawn straight stroke from a to b: a slow arm wobble, a little overshoot at the end.
export function hand(a, b, seed, amp = 3, n = 12) {
  const r = rng(seed), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ph = r() * 6, pts = [];
  for (let i = 0; i <= n; i++) { const f = (i / n) * 1.03, o = Math.sin(f * 2.6 + ph) * amp + (r() - 0.5) * amp * 0.3; pts.push([a[0] + dx * f + nx * o, a[1] + dy * f + ny * o]); }
  return pts;
}
// A box drawn as four separate strokes, each overshooting its corner. Returns four point lists, in drawing order.
export function box(x0, y0, x1, y1, seed, over = 10) {
  return [hand([x1 + over * 0.3, y0], [x0 - over, y0 + 1], seed), hand([x0, y0 - over * 0.4], [x0 + 1, y1 + over], seed + 1),
    hand([x0 - over * 0.3, y1], [x1 + over, y1 - 1], seed + 2), hand([x1, y1 + over * 0.4], [x1 - 1, y0 - over], seed + 3)];
}
// A loop drawn round a centre, a little more than once round, so it overshoots where it began.
export function loop(cx, cy, rx, ry, seed, turns = 1.15, ccw = false) {
  const r = rng(seed), pts = [], a0 = -2.2 + r() * 0.4;
  for (let i = 0; i <= 40; i++) { const a = a0 + (ccw ? -1 : 1) * (i / 40) * turns * 6.283, k = 1 + (i / 40) * 0.08 + Math.sin(i * 0.7 + r()) * 0.015; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return pts;
}
// Colouring in a box with the broad side of the coloured marker: a zigzag from the reading side, `w` wide.
export function fillIn(x0, y0, x1, y1, w, rtl, seed) {
  const r = rng(seed), pts = [], step = w * 0.42, n = Math.max(2, Math.ceil((x1 - x0) / step));
  for (let i = 0; i <= n; i++) { const x = rtl ? x1 - i * step : x0 + i * step, j = (r() - 0.5) * w * 0.3; pts.push([x + (i % 2 ? w * 0.25 : -w * 0.25) * (rtl ? -1 : 1), i % 2 ? y1 + j : y0 + j]); }
  return pts;
}

// Lettering: a schedule for the words of a fitted text (each word outlined, then coloured in), and the `each` that does it.
export function schedule(f, t0, speed = 1500, lift = 0.06, base = 0.14) {
  const times = []; let t = t0;
  f.rows.forEach((row) => row.words.forEach((w) => { const d = base + w.width / speed; times.push([t, t + d]); t += d + lift; }));
  return { at: (i) => times[i], end: t };
}
export function letter(c, t, sp, w, b, f, color, rtl) {
  const p = clamp((t - sp[0]) / (sp[1] - sp[0]));
  if (p <= 0) return false;
  c.globalCompositeOperation = 'multiply';
  c.direction = w.arabic ? 'rtl' : 'ltr'; c.textAlign = w.arabic ? 'right' : 'left';
  const x = w.arabic ? b.x + b.width : b.x, po = clamp(p / 0.55), pf = clamp((p - 0.45) / 0.55);
  if (pf < 1) {                                                   // the outline, traced from the reading side
    c.save(); c.beginPath(); const ww = (b.width + f.size * 0.4) * ease.outQuad(po); c.rect(rtl ? b.x + b.width + f.size * 0.2 - ww : b.x - f.size * 0.2, b.y - f.size, ww, f.size * 2); c.clip();
    c.strokeStyle = color; c.lineWidth = Math.max(2.5, f.size * 0.045); c.lineJoin = 'round'; c.strokeText(w.w, x, b.y); c.restore();
  }
  if (pf <= 0) return false;
  if (pf < 1) { c.beginPath(); const ww = (b.width + f.size * 0.4) * pf; c.rect(rtl ? b.x + b.width + f.size * 0.2 - ww : b.x - f.size * 0.2, b.y - f.size, ww, f.size * 2); c.clip(); }
  return color;
}
// Squeezes a schedule so that it ends by t = 0 when the part opens the reel (at < 0): the first frame shows the whole line.
export const hurry = (at, total) => (at < 0 ? Math.max(1, total / (-at - 0.05)) : 1);
