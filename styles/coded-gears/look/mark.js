// A legend below the safe area: one small wheel in each system colour, side by side, and the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, gearPath, drawGear } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const G = gearPath(9, 3, { bore: 0.3, spokes: false });
  return {
    draw(ctx) {
      const y = SAFE.bottom + 70, x = rtl ? SAFE.right - 16 : SAFE.left + 16;
      [pal.A, pal.B, pal.C].forEach((S, i) => drawGear(ctx, G, x + (rtl ? -1 : 1) * i * 34, y - 8, i * 0.3, S, { depth: 3 }));
      ctx.save(); ctx.fillStyle = pal.grey; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, x + (rtl ? -1 : 1) * 104, y - 6); ctx.restore();
    },
  };
}
