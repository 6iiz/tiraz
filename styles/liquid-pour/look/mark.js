// A small mark on the wall just above the pool: one drop of the key colour and the handle in the mono face, in the muted liquid's
// colour. Flat, decoration only (the app may cover it).
import { SAFE } from '/engine/kit.js';
import { palette } from './ground.js';
export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 92, x = rtl ? SAFE.right : SAFE.left;
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(brand.handle).width, dx = rtl ? x - 10 : x + 10;
      ctx.fillStyle = P.key; ctx.beginPath(); ctx.moveTo(dx, y - 13); ctx.bezierCurveTo(dx + 7, y - 3, dx + 8, y + 2, dx + 8, y + 4);
      ctx.arc(dx, y + 4, 8, 0, Math.PI); ctx.bezierCurveTo(dx - 8, y + 2, dx - 7, y - 3, dx, y - 13); ctx.fill();
      ctx.globalAlpha = 0.72; ctx.fillStyle = P.lead; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 28 : x + 28, y + 1);
      ctx.restore();
    },
  };
}
