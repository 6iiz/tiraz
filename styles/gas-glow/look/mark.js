// A small enamel plate on the window sill, below the safe area: the handle in the mono face, and a tiny lit tube beside it.
// Decoration only.
import { SAFE, rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = 1790, x = rtl ? SAFE.right - 10 : SAFE.left + 10;
      ctx.save(); ctx.font = `600 22px "${mono}"`; const tw = ctx.measureText(brand.handle).width, x0 = rtl ? x - tw - 70 : x;
      ctx.fillStyle = pal.metalDark; ctx.beginPath(); ctx.roundRect(x0, y - 26, tw + 70, 52, 8); ctx.fill();
      ctx.fillStyle = rgba(pal.light, 0.12); ctx.fillRect(x0 + 6, y - 24, tw + 58, 2);
      ctx.fillStyle = pal.painted; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 16 : x + 54, y + 1);
      const tx = rtl ? x0 + 26 : x + 26; ctx.shadowColor = pal.key.glow; ctx.shadowBlur = 12; ctx.strokeStyle = pal.key.tube; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx - 9, y + 6); ctx.lineTo(tx, y - 8); ctx.lineTo(tx + 9, y + 6); ctx.stroke(); ctx.restore();
    },
  };
}
