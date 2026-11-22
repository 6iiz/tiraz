// The cutter's mark below the safe area: the brand's logo cut into a small square of the block on the far side, and the handle in the
// mono face cut beside it as letters of light. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';

export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const y = SAFE.bottom + 78, s = 40, x = rtl ? SAFE.left : SAFE.right - s;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = P.paper; ctx.fillRect(x - 6, y - s / 2 - 6, s + 12, s + 12);
      brand.logo.draw(ctx, x, y - s / 2, s, P.ink);
      ctx.font = `700 22px "${mono}"`; ctx.fillStyle = P.soft; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'left' : 'right'; ctx.fillText(brand.handle, rtl ? x + s + 20 : x - 20, y);
      ctx.restore();
    },
  };
}
