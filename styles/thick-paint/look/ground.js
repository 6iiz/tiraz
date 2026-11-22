// The thick-paint ground: the whole frame is a canvas covered edge to edge in knife strokes of the dark brand colour, a few percent
// apart in tone, every stroke with its lit ridge and dark lip. Low in the frame (under the app's own buttons) the strokes lie flat as a
// painted waterline, and under four lights on it hang stacks of short horizontal dabs: their reflections, in the accent and the paint.
// What lives while a line holds: the raking light slowly travels over the ridges, and the reflection dabs glint one by one.
// The painted canvas is built once per palette and kept for the whole reel; the light moves on `clock`.
import { mix, rng } from '/engine/kit.js';
import { palette, stroke } from './motion.js';

const cache = new Map();
function build(W, H, P, T) {
  const key = [W, H, P.ground, P.paint, P.accent].join();
  if (cache.has(key)) return cache.get(key);
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  const g = base.getContext('2d'), r = rng(4512);
  g.fillStyle = P.ground; g.fillRect(0, 0, W, H);
  const horizon = T.ground.horizon;
  // the upper field: slabs at a slight slant, in patches of one direction (as a hand works an area)
  for (let i = 0; i < 1500; i++) {
    const x = r() * (W + 200) - 100, y = r() * (horizon + 40), patch = Math.floor(x / 270) + Math.floor(y / 300) * 5;
    const ang = (((patch * 7919) % 11) / 11 - 0.5) * 0.7 + (r() - 0.5) * 0.25;
    const c1 = mix(P.ground, r() < 0.82 ? P.paint : P.accent, r() * T.tone.field), c2 = mix(P.ground, P.paint, r() * T.tone.field * 1.4);
    stroke(g, x, y, 70 + r() * 150, 26 + r() * 30, ang, c1, c2, r, 0.75);
  }
  // the waterline: long flat slabs, darker, below the horizon
  for (let y = horizon - 10; y < H + 30; y += 18 + r() * 10) {
    for (let x = -60 - r() * 80; x < W + 60;) {
      const len = 160 + r() * 260, c1 = mix(P.ground, P.paint, r() * T.tone.field * 0.6), c2 = mix(P.ground, P.accent, r() * T.tone.field);
      stroke(g, x + len / 2, y, len, 22 + r() * 12, (r() - 0.5) * 0.04, c1, c2, r, 0.6); x += len - 30;
    }
  }
  // the lights on the far bank and their reflections, as a list of dabs that glint at their own phase
  const lights = [], dabs = [];
  for (let k = 0; k < 4; k++) {
    const lx = 120 + k * 260 + (r() - 0.5) * 90, col = k % 2 ? mix(P.paint, P.accent, 0.35) : P.accent;
    lights.push({ x: lx, c: col });
    stroke(g, lx, horizon - 18, 26, 16, 0, col, mix(col, P.ground, 0.3), r, 0.8);
    for (let j = 0; j < 14; j++) dabs.push({ x: lx + (r() - 0.5) * (18 + j * 3), y: horizon + 14 + j * 30 + r() * 8, w: 50 + r() * 50 - j * 2, h: 7 + r() * 5,
      c: mix(col, P.ground, j / 18), ph: r() * 6.28, sp: 0.7 + r() * 1.2, a: 1 - j / 16 });
  }
  // the light on the ridges as its own layer, so it can travel
  const lit = document.createElement('canvas'); lit.width = W; lit.height = H;
  const l = lit.getContext('2d'), r2 = rng(733);
  for (let i = 0; i < 500; i++) {
    const x = r2() * W, y = r2() * horizon, w = 40 + r2() * 110;
    l.globalAlpha = 0.12 + r2() * 0.25; l.fillStyle = mix(P.ground, P.paint, T.tone.light);
    l.save(); l.translate(x, y); l.rotate((r2() - 0.5) * 0.5); l.fillRect(-w / 2, 0, w, 1.5 + r2()); l.restore();
  }
  const out = { base, lit, dabs, horizon };
  cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand), B = build(W, H, P, T);
  return {
    P, horizon: B.horizon,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(B.base, 0, 0);
      ctx.save(); ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 0.35);           // the raking light drifts over the ridges
      ctx.drawImage(B.lit, Math.sin(time * 0.21) * 14, Math.cos(time * 0.17) * 8); ctx.restore();
      for (const d of B.dabs) {
        const a = d.a * (0.55 + 0.45 * Math.sin(time * d.sp + d.ph));
        if (a <= 0.02) continue;
        ctx.globalAlpha = a; ctx.fillStyle = d.c; ctx.fillRect(d.x - d.w / 2 + Math.sin(time * 0.6 + d.ph) * 4, d.y, d.w, d.h);
      }
      ctx.globalAlpha = 1;
    },
  };
}
