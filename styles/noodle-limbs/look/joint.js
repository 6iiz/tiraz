// The cartoon's joint: the projector loses its loop and the picture rolls up by one frame. The old scene rides up out of the gate, a
// dark frame line passes, and the next scene rides up into place, in a few jerky steps (on twos) with a little jump as it locks.
import { ease, rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), bar = 64;
  return {
    draw(ctx, from, to, p) {
      const q = Math.min(1, Math.floor(p * 7) / 6), e = ease.inOutCubic(q), lock = q >= 1 ? 0 : (q > 0.8 ? -14 : 0);
      const y = -Math.round((H + bar) * e) + lock;
      ctx.drawImage(from, 0, y);
      ctx.fillStyle = P.dark; ctx.fillRect(0, y + H, W, bar);
      ctx.fillStyle = rgba(P.light, 0.25); for (let x = 40; x < W; x += 120) ctx.fillRect(x, y + H + 20, 50, 24);
      ctx.drawImage(to, 0, y + H + bar);
    },
  };
}
