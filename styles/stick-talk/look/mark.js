// Below the system line: a tiny standing figure with the accent head beside the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, figure } from './motion.js';
export async function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = H - 90, x = rtl ? SAFE.right - 20 : SAFE.left + 20;
      figure(ctx, P, x, y + 22, 56, { head: 'accent' });
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.fillStyle = P.note; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 28 : x + 28, y); ctx.restore();
    },
  };
}
