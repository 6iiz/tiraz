// A small leaded jewel and the handle, on the stone below the safe area. Decoration only.
import { SAFE, rgba } from '/engine/kit.js';
import { palette, jewel } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const y = SAFE.bottom + 140, x = SAFE.left + 30;
  return {
    draw(ctx) {
      ctx.save(); jewel(ctx, x, y, 10, pal, pal.accent, 1);
      ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(pal.light, 0.6);
      ctx.fillText(brand.handle, x + 26, y); ctx.restore();
    },
  };
}
