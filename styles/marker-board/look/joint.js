// The white board's joint: the camera travels along the board to the next idea, in the direction of reading, instead of cutting. The old
// region slides away and the next one slides in beside it as one continuous board (the rails line up), with a touch of motion smear at
// the fastest moment. Tonal by construction: it is the same board.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const dir = brand.dir !== 'ltr' ? 1 : -1;            // right to left reading: the next idea sits to the left, so the board moves right
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), x = dir * W * q, v = Math.sin(Math.PI * p);
      ctx.drawImage(from, x, 0); ctx.drawImage(to, x - dir * W, 0);
      if (v > 0.2) {
        ctx.save(); ctx.globalAlpha = 0.3 * v; const s = -dir * 26 * v;
        ctx.drawImage(from, x + s, 0); ctx.drawImage(to, x - dir * W + s, 0); ctx.restore();
      }
    },
  };
}
