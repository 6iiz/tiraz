// A small dark label slip with the handle in the mono face, glued below the safe area on the reading side. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, torn, slip } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const c0 = document.createElement('canvas').getContext('2d'); c0.font = `600 22px "${mono}"`;
  const w = c0.measureText(brand.handle).width + 44, h = 40, shape = torn(w, h, 303, 6);
  return {
    draw(ctx) {
      const x = rtl ? SAFE.left + w / 2 : SAFE.right - w / 2, y = SAFE.bottom + 74;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.025);
      ctx.save(); ctx.translate(4, 5); ctx.fillStyle = P.shadow; ctx.beginPath(); shape(ctx); ctx.fill(); ctx.restore();
      slip(ctx, P, shape, P.ink);
      ctx.fillStyle = P.paper; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, 0, 1);
      ctx.restore();
    },
  };
}
