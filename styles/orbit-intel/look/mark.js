// An analyst's corner below the safe area: a north tick, a scale bar whose divisions widen as the camera descends (no figures on it),
// and the handle in the mono face. Decoration only.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = 1830, x = SAFE.left + 6, T = look.tokens.cam;
  return {
    draw(ctx, t) {
      ctx.save();
      ctx.fillStyle = rgba(pal.dark, 0.75); ctx.fillRect(x - 12, y - 34, 470, 62);
      ctx.strokeStyle = pal.light; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y + 12); ctx.lineTo(x + 10, y - 18); ctx.moveTo(x + 3, y - 10); ctx.lineTo(x + 10, y - 20); ctx.lineTo(x + 17, y - 10); ctx.stroke();
      const seg = 30 * Math.pow(2, (t % T.half) / T.half);
      ctx.fillStyle = rgba(pal.light, 0.8); ctx.fillRect(x + 34, y + 8, seg * 4, 2);
      for (let k = 0; k <= 4; k++) ctx.fillRect(x + 34 + k * seg - 1, y + (k % 2 ? 2 : -4), 2, k % 2 ? 6 : 12);
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.light, 0.6); ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
      ctx.fillText(brand.handle, x + 34 + 4 * 60 + 20, y + 2); ctx.restore();
    },
  };
}
