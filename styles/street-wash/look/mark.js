// Below the safe area, as a sketcher notes where a page was drawn: a short pen dash and the handle in the mono face, in a quiet tone.
// Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, pen, draw } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 62, x = rtl ? SAFE.right - 10 : SAFE.left + 10, dash = pen([[x, y + 16], [x + (rtl ? -60 : 60), y + 14]], 77, { over: 4, gap: false });
  const grey = pal.quiet(0.62);
  return {
    draw(ctx) {
      draw(ctx, dash, 1, pal.line, 2);
      ctx.save(); ctx.fillStyle = grey; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, x, y - 6); ctx.restore();
    },
  };
}
