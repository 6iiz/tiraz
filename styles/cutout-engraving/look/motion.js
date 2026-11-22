// Cut-out motion: every piece is paper moved by hand, filmed on twos (12 drawings a second). A piece is put down lifted (a little
// larger, turned a little, its shadow long and soft), then pressed onto the table: it shrinks to size, turns home with a small
// overshoot and its shadow tucks in under it. Nothing fades and nothing scales from zero. This file also holds the inks, the torn
// paper slips that carry every word, and the shared helpers the parts use.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

export const FPS = 12;
export const twos = (t) => Math.floor(t * FPS + 1e-6) / FPS;
const back = (p) => { p = clamp(p); const c = 1.1; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; };   // a small overshoot

export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const lighter = contrast(bg, '#000000') >= contrast(text, '#000000');
  const paper = lighter ? bg : text, ink = lighter ? text : bg;
  const on = (fill) => (contrast(fill, ink) >= contrast(fill, paper) ? ink : paper);
  return {
    paper, ink, accent, on, onAccent: on(accent),
    table: mix(paper, ink, 0.13), sheet: mix(paper, accent, 0.32), dusk: mix(ink, accent, 0.28),
    edge: mix(paper, ink, 0.3), shadow: rgba(ink, 0.26), hatch: ink,
  };
}

// A piece's pose while it is pressed down: p 0 = just put down (lifted), 1 = glued. Returns false before it is put down.
export function press(p, turn = 0, from = 1) {
  if (p <= 0) return false;
  const e = back(p);
  return { s: 1 + 0.06 * (1 - e), rot: turn + 4 * (1 - e) * from, dx: 24 * (1 - clamp(p * 1.4)) * from, lift: 1 - clamp(p) };
}
// Runs draw() around a pose, centred on (cx, cy), with its shadow: shape(ctx) traces the piece's outline for the shadow.
export function piece(ctx, P, pose, cx, cy, shape, draw) {
  if (!pose) return;
  const r = (pose.rot * Math.PI) / 180, so = 7 + 20 * pose.lift;
  ctx.save(); ctx.translate(cx + pose.dx + so, cy + so * 1.2); ctx.rotate(r); ctx.scale(pose.s, pose.s);
  ctx.filter = `blur(${(2 + 7 * pose.lift).toFixed(1)}px)`; ctx.fillStyle = P.shadow; ctx.beginPath(); shape(ctx); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(cx + pose.dx, cy); ctx.rotate(r); ctx.scale(pose.s, pose.s); draw(ctx); ctx.restore();
}

// A torn outline round a w x h box centred on 0,0: straight cut long sides, torn short ends (rough = how torn). Built once.
export function torn(w, h, seed, rough = 10, allTorn = false) {
  const r = rng(seed), pts = [], j = (a) => (r() - 0.5) * a;
  const n = Math.max(4, Math.round(w / 34)), m = Math.max(3, Math.round(h / 16));
  for (let i = 0; i <= n; i++) pts.push([-w / 2 + (w * i) / n, -h / 2 + (allTorn ? j(rough) : j(2))]);
  for (let i = 1; i <= m; i++) pts.push([w / 2 + j(rough), -h / 2 + (h * i) / m]);
  for (let i = n - 1; i >= 0; i--) pts.push([-w / 2 + (w * i) / n, h / 2 + (allTorn ? j(rough) : j(2))]);
  for (let i = m - 1; i > 0; i--) pts.push([-w / 2 + j(rough), -h / 2 + (h * i) / m]);
  return (ctx) => { ctx.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) ctx.lineTo(x, y); ctx.closePath(); };
}
// A paper slip: its torn shape filled, with a fine cut edge to show its thickness.
export function slip(ctx, P, shape, fill) {
  ctx.fillStyle = fill; ctx.beginPath(); shape(ctx); ctx.fill();
  ctx.strokeStyle = fill === P.paper ? P.edge : mix(fill, P.ink, 0.35); ctx.lineWidth = 1.5; ctx.stroke();
}
