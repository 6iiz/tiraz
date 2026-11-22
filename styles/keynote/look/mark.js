// A small pill below the safe area, on the second surface with a 1 px border: the logo small and the handle in the mono face, half lit.
// Decoration only: the app may cover it.
import { rgba, rr, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left, y = SAFE.bottom + 44, h = 52;
  return {
    draw(ctx) {
      ctx.save();
      ctx.font = `500 21px "${mono}"`; const w = 26 + 28 + 14 + ctx.measureText(brand.handle).width + 24;
      rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = rgba(pal.s2, 0.9); ctx.fill(); ctx.strokeStyle = pal.border; ctx.lineWidth = 1; ctx.stroke();
      brand.logo.small(ctx, x + 22, y + 12, 28, rgba(pal.light, 0.75));
      ctx.fillStyle = rgba(pal.light, 0.65); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 22 + 28 + 14, y + h / 2 + 1);
      ctx.restore();
    },
  };
}
