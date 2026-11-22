// A short stroke of the coloured marker and the handle in the mono face in the grey marker, below the safe area. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, marker, hand } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 60, x1 = rtl ? SAFE.right : SAFE.left + 50, x0 = x1 - 50, dash = hand([rtl ? x1 : x0, y], [rtl ? x0 : x1, y - 3], 5, 1.5, 5);
  return {
    draw(ctx) {
      marker(ctx, dash, 1, P.pen, 8);
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.grey; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x0 - 18 : x1 + 18, y - 2); ctx.restore();
    },
  };
}
