// The handle, small and grey, in the mono face above the safe area on the far side, out of the line's way. Decoration only.
import { SAFE } from '/engine/kit.js';
import { inks } from './motion.js';
export async function create({ W, brand, look }) {
  const K = inks(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      ctx.save(); ctx.fillStyle = K.grey; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic';
      ctx.textAlign = rtl ? 'left' : 'right'; ctx.fillText(brand.handle, rtl ? SAFE.left : SAFE.right, SAFE.top - 70); ctx.restore();
    },
  };
}
