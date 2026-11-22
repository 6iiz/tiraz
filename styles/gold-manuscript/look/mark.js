// A small scribe's mark below the safe area: a square of leaf with a pearl, and the handle beside it in white lead. Decoration only.
import { SAFE, rgba } from '/engine/kit.js';
import { palette, pearl } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const y = SAFE.bottom + 76, x = SAFE.left + 30;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = pal.leaf; ctx.fillRect(x, y - 13, 26, 26); ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.5; ctx.strokeRect(x, y - 13, 26, 26); pearl(ctx, x + 13, y, 3, pal);
      ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(pal.onField, 0.8);
      ctx.fillText(brand.handle, x + 42, y);
      ctx.restore();
    },
  };
}
