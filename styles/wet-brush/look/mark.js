// Below the safe area: a small dab of the pigment and the handle beside it in the mono face, in a quiet tone. Decoration only.
import { SAFE, rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 72, x = rtl ? SAFE.right - 14 : SAFE.left + 14, grey = pal.quiet(0.6);
  return {
    draw(ctx) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = rgba(pal.accent, 0.55); ctx.beginPath(); ctx.ellipse(x, y, 15, 11, -0.3, 0, 7); ctx.fill();
      ctx.fillStyle = rgba(pal.accent, 0.35); ctx.beginPath(); ctx.ellipse(x + 3, y + 1, 11, 8, 0.4, 0, 7); ctx.fill();
      ctx.restore(); ctx.save();
      ctx.fillStyle = grey; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 30 : x + 30, y + 1); ctx.restore();
    },
  };
}
