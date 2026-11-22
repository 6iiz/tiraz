// Below the safe area: a red rivet and the handle in the mono face on a short ink tab. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 72;
      ctx.save(); ctx.font = `700 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(brand.handle).width + 28, x = rtl ? SAFE.right - w : SAFE.left + 34;
      ctx.fillStyle = P.ink; ctx.fillRect(x, y - 18, w, 36);
      ctx.fillStyle = P.red; ctx.fillRect(rtl ? x - 34 : x - 34, y - 12, 24, 24);
      ctx.fillStyle = P.paper; ctx.textAlign = 'left'; ctx.fillText(brand.handle, x + 14, y + 1);
      ctx.restore();
    },
  };
}
