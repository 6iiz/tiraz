// Below the safe area: a small red seal and the handle beside it in the mono face, in a middle tone of the ink. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 70, x = rtl ? SAFE.right - 18 : SAFE.left;
  return {
    draw(ctx) {
      ctx.save(); ctx.fillStyle = pal.seal; ctx.fillRect(x, y - 9, 18, 18);
      ctx.fillStyle = pal.grey; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 14 : x + 32, y + 1); ctx.restore();
    },
  };
}
