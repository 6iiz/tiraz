// A sheet label below the safe area: the handle in the mono face, small and grey, between two short plotted ticks. Decoration only.
import { SAFE } from '/engine/kit.js';
import { inks } from './motion.js';
export async function create({ W, brand, look }) {
  const K = inks(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 74, x = rtl ? SAFE.right : SAFE.left;
      ctx.save(); ctx.fillStyle = K.grey; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, x, y);
      const w = ctx.measureText(brand.handle).width;
      ctx.fillRect(rtl ? x - w : x, y + 10, w, 1.5); ctx.restore();
    },
  };
}
