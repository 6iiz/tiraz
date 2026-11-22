// Below the safe area: the handle in the mono face beside a small scope glyph (a ring with its arm). Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, pal = palette(brand), rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 70, gx = rtl ? SAFE.left + 14 : SAFE.right - 14;
      ctx.strokeStyle = pal.ringHi; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, y - 8, 13, 0, Math.PI * 2); ctx.moveTo(gx, y - 8); ctx.lineTo(gx + 9, y - 17); ctx.stroke();
      ctx.fillStyle = pal.soft; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? SAFE.right : SAFE.left, y);
    },
  };
}
