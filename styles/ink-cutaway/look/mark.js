// A title-block corner below the safe area: two ruled cells, a small scale bar in the first, the handle in the mono face in the
// second. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 40, w = 380, h = 56, x = rtl ? SAFE.right - w : SAFE.left;
      ctx.save(); ctx.strokeStyle = pal.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
      const xd = rtl ? x + w - 110 : x + 110; ctx.beginPath(); ctx.moveTo(xd, y); ctx.lineTo(xd, y + h); ctx.stroke();
      const bx = rtl ? x + w - 96 : x + 14;
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? pal.paper : pal.ink; ctx.fillRect(bx + i * 20, y + 24, 20, 8); }
      ctx.strokeRect(bx, y + 24, 80, 8);
      ctx.fillStyle = pal.ink; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillText(brand.handle, rtl ? x + (w - 110) / 2 : x + 110 + (w - 110) / 2, y + h / 2 + 1);
      ctx.restore();
    },
  };
}
