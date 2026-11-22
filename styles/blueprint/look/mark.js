// A small title block below the safe area: two ruled cells, the logo in one and the handle in the mono face in the other, in the
// sheet's line colour. Decoration only: the app may cover it.
import { rgba, SAFE } from '/engine/kit.js';
import { inks } from './motion.js';
export async function create({ W, brand, look }) {
  const ink = inks(brand, look.tokens.tone), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left, y = SAFE.bottom + 36, h = 64, cell = 64, line = rgba(ink.light, 0.45);
  return {
    draw(ctx) {
      ctx.save();
      ctx.font = `500 22px "${mono}"`; const w = cell + 28 + ctx.measureText(brand.handle).width + 24;
      ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
      ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + h); ctx.stroke();
      brand.logo.small(ctx, x + 14, y + 14, cell - 28, rgba(ink.light, 0.7));
      ctx.fillStyle = rgba(ink.light, 0.6); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + cell + 22, y + h / 2 + 1);
      ctx.restore();
    },
  };
}
