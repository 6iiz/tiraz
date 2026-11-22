// The show's corner mark, above the safe area: an accent square with the brand's small logo, the way an analysis show keeps its bug
// in the corner of every frame. The parts put their mode chip (play, freeze, rewind and the frame count) beside it. Decoration only.
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const s = 64, x = rtl ? 70 + 10 : 1010 - 10 - s, y = 150;
      ctx.save(); ctx.fillStyle = P.accent; ctx.fillRect(x, y, s, s);
      brand.logo.small(ctx, x + 12, y + 12, s - 24, P.onAccent); ctx.restore();
    },
  };
}
