// A small exposure note above the safe area: two overlapping rings (two exposures, one in the accent) and the handle in the mono
// face, pale. Decoration only.
import { mix, rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(P.paper, P.ink, 0.5);
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = 196, x = rtl ? SAFE.right - 14 : SAFE.left + 14;
      ctx.save(); ctx.lineWidth = 2;
      ctx.strokeStyle = rgba(P.ink, 0.45); ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = P.lamp; ctx.beginPath(); ctx.arc(x + (rtl ? -9 : 9), y - 3, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = c; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 36 : x + 36, y + 1);
      ctx.restore();
    },
  };
}
