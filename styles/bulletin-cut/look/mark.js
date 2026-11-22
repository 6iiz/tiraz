// The channel bug: a small slanted plate of the accent with the brand's logo, in the top corner on the far side, above the safe area,
// on every frame of the reel. Decoration only: nothing in it must be read.
import { SAFE } from '/engine/kit.js';
import { palette, plate } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', w = 104, h = 56, y = 176, x = rtl ? SAFE.left : SAFE.right - w;
  return {
    draw(ctx) {
      ctx.fillStyle = P.ink; plate(ctx, x + 6, y + 6, w, h, 16); ctx.fill();
      ctx.fillStyle = P.accent; plate(ctx, x, y, w, h, 16); ctx.fill();
      brand.logo.draw(ctx, x + w / 2 - 19, y + h / 2 - 19, 38, P.onAccent);
    },
  };
}
