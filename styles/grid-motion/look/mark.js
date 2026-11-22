// A small ink module and the handle in the mono face, below the safe area. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 62;
      ctx.save(); ctx.fillStyle = pal.ink;
      ctx.fillRect(rtl ? SAFE.right - 22 : SAFE.left, y - 11, 22, 22);
      ctx.font = `700 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? SAFE.right - 38 : SAFE.left + 38, y + 1);
      ctx.restore();
    },
  };
}
