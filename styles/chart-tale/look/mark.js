// A footnote under the chart, below the safe area: a tiny rising sparkline and the handle in the mono face, like a source line.
// Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = 1600, x = rtl ? SAFE.right : SAFE.left;
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.fillStyle = pal.muted; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 54 : x + 54, y);
      const sx = rtl ? x - 40 : x; ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
      [[0, 8], [10, 2], [20, 5], [30, -6], [40, -10]].forEach(([a, b], i) => (i ? ctx.lineTo(sx + a, y + b) : ctx.moveTo(sx + a, y + b))); ctx.stroke();
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(sx + 40, y - 10, 4, 0, 7); ctx.fill(); ctx.restore();
    },
  };
}
