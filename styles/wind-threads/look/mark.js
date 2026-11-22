// A small printed cartouche under the safe area on the reading side: the handle in the mono face inside a double rule, with a
// short arrow that says which way the wind blows. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 92;
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(brand.handle).width, bx = rtl ? SAFE.right - w - 28 : SAFE.left, bw = w + 28;
      ctx.strokeStyle = pal.ghost; ctx.lineWidth = 1.5; ctx.strokeRect(bx, y - 20, bw, 40); ctx.lineWidth = 0.8; ctx.strokeRect(bx + 4, y - 16, bw - 8, 32);
      ctx.fillStyle = pal.ghost; ctx.textAlign = 'left'; ctx.fillText(brand.handle, bx + 14, y + 1);
      const ax = rtl ? bx - 20 : bx + bw + 20, d = rtl ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(ax + d * 46, y); ctx.moveTo(ax + d * 46, y); ctx.lineTo(ax + d * 36, y - 6); ctx.moveTo(ax + d * 46, y); ctx.lineTo(ax + d * 36, y + 6); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    },
  };
}
