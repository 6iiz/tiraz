// Below the safe area: a small round line bullet in the accent with a paper ring, and the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { inks } from './motion.js';
export async function create({ W, brand, look }) {
  const I = inks(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 84, x = rtl ? SAFE.right - 16 : SAFE.left + 16;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; const tw = ctx.measureText(brand.handle).width;
      ctx.fillStyle = I.paper; ctx.fillRect(rtl ? x - tw - 50 : x - 28, y - 26, tw + 78, 52);
      ctx.fillStyle = I.accent; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = I.ink; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = I.dim; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 28 : x + 28, y); ctx.restore();
    },
  };
}
