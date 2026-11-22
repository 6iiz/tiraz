// The slide label on the bench, under the lens on the reading side: the handle in the mono face, small and grey, after a short rule.
// Decoration only, below the safe area.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 92;
      ctx.save(); ctx.fillStyle = pal.readout; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? SAFE.right : SAFE.left, y + 1);
      const w = ctx.measureText(brand.handle).width; ctx.fillRect(rtl ? SAFE.right - w - 46 : SAFE.left + w + 16, y - 1, 30, 2);
      ctx.restore();
    },
  };
}
