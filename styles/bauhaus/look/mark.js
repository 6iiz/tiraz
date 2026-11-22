// A small signature below the safe area: the three primaries in a row (an accent circle, an ink square, a mid-tone triangle) and the
// handle beside them in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';

export async function create({ W, brand, look }) {
  const P = palette(brand, look), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 64, s = 22, x = rtl ? SAFE.left : SAFE.right - 3 * s - 16;
      ctx.save();
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(x + s / 2, y, s / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.ink; ctx.fillRect(x + s + 8, y - s / 2, s, s);
      ctx.fillStyle = P.mid; ctx.beginPath(); ctx.moveTo(x + 2 * s + 16 + s / 2, y - s / 2); ctx.lineTo(x + 3 * s + 16, y + s / 2); ctx.lineTo(x + 2 * s + 16, y + s / 2); ctx.closePath(); ctx.fill();
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = P.soft; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'left' : 'right'; ctx.fillText(brand.handle, rtl ? x + 3 * s + 34 : x - 18, y);
      ctx.restore();
    },
  };
}
