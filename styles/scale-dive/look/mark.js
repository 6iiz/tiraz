// A small scale bar below the safe area, as on a map: a bar with end ticks, a stop ring, and the handle in the mono face. Decoration.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 74, x0 = rtl ? SAFE.right - 150 : SAFE.left, c = pal.tone(0.5);
      ctx.save(); ctx.fillStyle = c; ctx.fillRect(x0, y - 2, 150, 3); ctx.fillRect(x0, y - 12, 3, 22); ctx.fillRect(x0 + 147, y - 12, 3, 22); ctx.fillRect(x0 + 74, y - 8, 2, 14);
      ctx.strokeStyle = pal.sun; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rtl ? x0 - 24 : x0 + 174, y, 8, 0, 7); ctx.stroke();
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = c; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x0 - 46 : x0 + 196, y); ctx.restore();
    },
  };
}
