// Under the safe area: a small metal diamond and the handle in the mono face, in the metal tone. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 66, x = rtl ? SAFE.right - 8 : SAFE.left + 8;
      ctx.save(); ctx.fillStyle = P.metal; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 8); ctx.lineTo(x - 6, y); ctx.fill();
      ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 20 : x + 20, y + 1); ctx.restore();
    },
  };
}
