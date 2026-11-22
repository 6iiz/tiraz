// The grid-motion joint: the next page slides in band by band, each band on its own track, alternating direction, a few frames
// apart, so the frame shears across instead of fading. Both pages are the same accent ground, so the brightness holds.
import { clamp } from '/engine/kit.js';
import { SNAP } from './motion.js';
export function create({ W, H }) {
  const n = 10, h = H / n;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (let i = 0; i < n; i++) {
        const q = SNAP(clamp(p * 1.6 - i * 0.06)); if (q <= 0) continue;
        const dir = i % 2 ? 1 : -1, dx = Math.round(dir * (1 - q) * W), y = Math.floor(i * h), hh = Math.ceil(h) + 1;
        ctx.drawImage(to, 0, y, W, hh, dx, y, W, hh);
      }
    },
  };
}
