// A small pencilled scale bar (a ruled line with three ticks) and the handle in the mono face in the soft pencil, below the safe area.
// Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, pencil, wobble } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 34, x1 = rtl ? SAFE.right : SAFE.left + 90, x0 = x1 - 90;
  const bar = wobble([x0, y], [x1, y], 7, 1.2, 6), ticks = [0, 0.5, 1].map((f) => [[x0 + f * 90, y - (f === 0.5 ? 6 : 10)], [x0 + f * 90, y + 2]]);
  return {
    draw(ctx) {
      pencil(ctx, bar, 1, P.soft, 2); ticks.forEach((tk) => pencil(ctx, tk, 1, P.soft, 2));
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.fillStyle = P.soft; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x0 - 16 : x1 + 16, y - 4); ctx.restore();
    },
  };
}
