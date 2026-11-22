// Below the safe area, just over the ledge: the handle in the mono face in the dimmer chalk, with a short chalk dash before it.
// Decoration only: the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette, chalk } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left, y = SAFE.bottom + 72;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = chalk(ctx, P.accent, 17); ctx.fillRect(x, y - 3, 34, 6);
      ctx.font = `600 22px "${mono}"`; ctx.fillStyle = chalk(ctx, P.dim, 13); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 48, y + 1);
      ctx.restore();
    },
  };
}
