// Below the safe area: a small scratched star and the handle in the mono face, faint, at the reading side. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, star } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr', y = SAFE.bottom + 76;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(brand.handle).width, sx = rtl ? SAFE.right - 12 : SAFE.left + 12;
      star(ctx, sx, y, 10, 0, 7, P, P.dye);
      ctx.globalAlpha = 0.65; ctx.fillStyle = P.faint; ctx.textAlign = 'left'; ctx.fillText(brand.handle, rtl ? sx - 26 - w : sx + 26, y);
      ctx.restore();
    },
  };
}
