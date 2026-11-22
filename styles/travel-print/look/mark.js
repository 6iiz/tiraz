// The print's edition label below the safe area: a small paper slip on the hills with the handle in the mono face and a three-ring
// sun beside it. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, rings } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 78;
      ctx.save(); ctx.font = `600 22px "${mono}"`;
      const w = ctx.measureText(brand.handle).width + 78, x = rtl ? SAFE.left : SAFE.right - w;
      ctx.fillStyle = P.paper; ctx.fillRect(x, y - 22, w, 44);
      rings(ctx, rtl ? x + 24 : x + w - 24, y, 13, 3, [P.accent, P.ring]);
      ctx.fillStyle = P.ink; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'left' : 'right';
      ctx.fillText(brand.handle, rtl ? x + 46 : x + w - 46, y + 1);
      ctx.restore();
    },
  };
}
