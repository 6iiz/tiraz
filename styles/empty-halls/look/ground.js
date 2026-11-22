// The Empty Halls ground: the corridor (motion.js `hall`), walked slowly forward in reel time so it never jumps between scenes, with the
// camera's small handheld sway; then, from `over()`, the tape itself on top of everything: grain, scanlines, vignette, a tracking line.
import { palette, hall, tape } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand), h = hall(P, W, H, { vy: T.vy }), tp = tape(W, H, P);
  return {
    P, time: (t) => t + clock,
    draw(ctx, t, o = {}) { h.draw(ctx, t + clock, { speed: T.speed, ...o }); },
    over(ctx, t) { tp.draw(ctx, t + clock); },
  };
}
