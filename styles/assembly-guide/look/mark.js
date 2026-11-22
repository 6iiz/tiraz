// A page footer below the safe area, as a manual prints it: the handle in the mono face on the far side, small and grey, under the
// page rule. Decoration only.
import { inks } from './motion.js';
export async function create({ W, H, brand, look }) {
  const K = inks(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      ctx.save(); ctx.fillStyle = K.grey; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic';
      ctx.textAlign = rtl ? 'left' : 'right'; ctx.fillText(brand.handle, rtl ? 48 : W - 48, H - 118); ctx.restore();
    },
  };
}
