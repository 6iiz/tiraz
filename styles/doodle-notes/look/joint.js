// The notes' joint: the page scrolls on to the next note, as the eye follows the pen down the page. The finished note rides up out of
// view and the next one comes up from below on the same sheet (the dot grid runs on without a seam). Tonal by construction.
import { ease } from '/engine/kit.js';
export function create({ W, H }) {
  return {
    draw(ctx, from, to, p) {
      const y = -Math.round(H * ease.inOutCubic(p));
      ctx.drawImage(from, 0, y); ctx.drawImage(to, 0, y + H);
    },
  };
}
