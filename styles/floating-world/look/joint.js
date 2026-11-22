// The floating-world joint: the handscroll is wound on. Both prints travel sideways together, in the reading direction, joined by a strip
// of darker mounting paper with a ruled edge on each side, so the next print arrives as the next scene of one long scroll.
import { ease } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', S = 70;
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), off = q * (W + S), s = rtl ? 1 : -1;
      ctx.save();
      ctx.translate(s * off, 0); ctx.drawImage(from, 0, 0);
      const sx = rtl ? -S : W;
      ctx.fillStyle = P.mount; ctx.fillRect(sx, 0, S, H);
      ctx.fillStyle = P.ink; ctx.fillRect(sx + 6, 0, 2, H); ctx.fillRect(sx + S - 8, 0, 2, H);
      ctx.drawImage(to, rtl ? -S - W : W + S, 0);
      ctx.restore();
    },
  };
}
