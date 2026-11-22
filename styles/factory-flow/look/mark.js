// Below the safe area: a small gear and the handle in the mono face, on the works floor. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, gear } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 84, x = rtl ? SAFE.right - 18 : SAFE.left + 18;
  return {
    draw(ctx) {
      ctx.save(); gear(ctx, x, y, 16, 0, P.accent, P, 8);
      ctx.fillStyle = P.dim; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 30 : x + 30, y); ctx.restore();
    },
  };
}
