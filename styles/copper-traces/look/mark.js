// Below the safe area: a small fiducial (a gold dot in a clear ring) and the handle in the mono face, in dim silkscreen. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 80, x = rtl ? SAFE.right - 14 : SAFE.left + 14;
  return {
    draw(ctx) {
      ctx.save();
      ctx.font = `600 22px "${mono}"`; const tw = ctx.measureText(brand.handle).width;
      ctx.fillStyle = P.mask; ctx.fillRect(rtl ? x - tw - 52 : x - 26, y - 22, tw + 78, 44);
      ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.dim; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.dim; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 32 : x + 32, y);
      ctx.restore();
    },
  };
}
