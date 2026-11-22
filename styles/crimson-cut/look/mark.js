// Below the safe area: a small window flower and the handle on the sheet. Decoration only.
import { SAFE } from '/engine/kit.js';
import { papers, rosette, lay } from './motion.js';
export async function create({ W, brand }) {
  const P = papers(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr', f = rosette(18, P.red, 0, 4);
  return {
    draw(ctx, t) {
      const y = SAFE.bottom + 74, x = rtl ? SAFE.right - 18 : SAFE.left + 18;
      ctx.save(); ctx.translate(x, y); ctx.rotate((t || 0) * 0.3); lay(ctx, f, 0, 0); ctx.restore();
      ctx.save(); ctx.font = '700 22px "' + mono + '"'; ctx.fillStyle = P.txt; ctx.globalAlpha = 0.75; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 32 : x + 32, y + 1); ctx.restore();
    },
  };
}
