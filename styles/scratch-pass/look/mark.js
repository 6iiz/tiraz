// Below the safe area: a small carved paper slip at the reading side with a red knife mark and the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, knife } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr', y = SAFE.bottom + 74;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      const w = ctx.measureText(brand.handle).width + 80, x0 = rtl ? SAFE.right - w : SAFE.left;
      ctx.fillStyle = P.ink; ctx.fillRect(x0 - 4, y - 24, w + 8, 48);
      ctx.fillStyle = P.paper; for (let k = 0; k < 5; k++) ctx.fillRect(x0, y - 20 + k * 8, w, 7);
      knife(ctx, rtl ? x0 + w - 40 : x0 + 14, rtl ? x0 + w - 14 : x0 + 40, y, 8, P.red, 1, rtl);
      ctx.fillStyle = P.ink; ctx.fillText(brand.handle, rtl ? x0 + 16 : x0 + 54, y + 1);
      ctx.restore();
    },
  };
}
