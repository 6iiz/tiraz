// The channel bug of a feed: a block of the accent with the brand's short name in the top corner on the reading side, above the safe
// area, and a thin bar of the light colour under it. Decoration only: nothing in it must be read.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look, kit }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr';
  const word = kit.fit(brand.shortName || brand.name, { size: 30, weight: 800, maxW: 380, single: true, where: 'the bug' });
  const w = word.width + 36, h = 50, y = 168, x = rtl ? SAFE.right - w : SAFE.left;
  return {
    draw(ctx) {
      ctx.fillStyle = P.accent; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = P.light; ctx.fillRect(rtl ? x + w * 0.45 : x, y + h + 6, w * 0.55, 5);
      kit.drawText(ctx, word, { x0: x, x1: x + w, y: y + h / 2 + 1, align: 'center', color: P.onAccent, key: P.onAccent, decor: true });
    },
  };
}
