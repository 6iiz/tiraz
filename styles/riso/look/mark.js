// A printer's registration mark below the safe area: a target in ink and the same target in accent a few pixels off, with the handle
// beside it in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';

export async function create({ W, brand, look }) {
  const P = palette(brand, look), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const target = (ctx, x, y, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20); ctx.stroke();
  };
  return {
    draw(ctx) {
      const y = SAFE.bottom + 64, x = rtl ? SAFE.left + 20 : SAFE.right - 20;
      ctx.save();
      target(ctx, x, y, P.soft);
      ctx.globalCompositeOperation = 'multiply'; target(ctx, x + 3, y - 2, P.accent); ctx.globalCompositeOperation = 'source-over';
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = P.soft; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'left' : 'right'; ctx.fillText(brand.handle, rtl ? x + 36 : x - 36, y);
      ctx.restore();
    },
  };
}
