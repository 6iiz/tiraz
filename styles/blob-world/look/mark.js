// The board's printed legend below the safe area: a small accent dot like a Pip seen from above, and the handle in the mono face.
// Decoration only: the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr', y = 1866;
  return {
    draw(ctx) {
      const x = rtl ? SAFE.right - 12 : SAFE.left + 12;
      ctx.fillStyle = P.acc; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.fillStyle = P.grey; ctx.font = `600 22px "${mono}"`; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 26 : x + 26, y); ctx.restore();
    },
  };
}
