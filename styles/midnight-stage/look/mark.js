// The handle in the mono face on the front of the stage, below the safe area, with one small lit bulb beside it. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, bulbSprite } from './motion.js';
export async function create({ brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr', b = bulbSprite(pal);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 150, x = rtl ? SAFE.right - 12 : SAFE.left + 12;
      ctx.save(); ctx.drawImage(b, x - 20, y - 20);
      ctx.fillStyle = pal.dim; ctx.font = `500 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 26 : x + 26, y + 1);
      ctx.restore();
    },
  };
}
