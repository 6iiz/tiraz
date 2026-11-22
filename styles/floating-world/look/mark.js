// A tall title cartouche at the head of the sheet on the reading side, above the safe area, holding the brand's logo in ink, with the
// brand's seal pressed just under it, as a print carries its title and its seal. Decoration only.
import { palette, cartouche, seal } from './motion.js';

export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr';
  const w = 74, h = 150, x = rtl ? W - 66 - w : 66, y = 62;
  return {
    draw(ctx) {
      ctx.save();
      cartouche(ctx, x, y, w, h, P);
      brand.logo.draw(ctx, x + 17, y + 22, w - 34, P.ink);
      seal(ctx, brand, x + w / 2, y + h - 34, 40, P);
      ctx.restore();
    },
  };
}
