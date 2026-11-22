// A small square dab of the accent with a lit edge, and the handle in the mono face in the muted paint, below the safe area.
// Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, plane, drawPlane } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const dab = plane(30, 30, P.accent, [P.paint, P.ground], 31, { row: 15, pad: 8 }), y = SAFE.bottom + 70;
  return {
    draw(ctx) {
      const x = rtl ? SAFE.right - 30 : SAFE.left;
      drawPlane(ctx, dab, x, y - 15);
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.muted; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 16 : x + 46, y); ctx.restore();
    },
  };
}
