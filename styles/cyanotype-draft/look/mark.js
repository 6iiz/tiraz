// A small open circle (the sun the print was made in) and the handle in the mono face, in the softer white, low on the sheet below
// the safe area. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 66, x = rtl ? SAFE.right - 14 : SAFE.left + 14;
      ctx.save(); ctx.strokeStyle = pal.soft; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = pal.soft; ctx.font = `500 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 26 : x + 26, y + 1);
      ctx.restore();
    },
  };
}
