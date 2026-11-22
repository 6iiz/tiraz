// A page tag below the safe area: the handle in the mono face, in a small paper box with an ink border and a solid ink corner,
// like the running foot of a printed page. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 118, x = SAFE.left;
      ctx.save(); ctx.font = `700 22px "${mono}"`; const w = ctx.measureText(brand.handle).width + 54;
      ctx.fillStyle = P.paper; ctx.fillRect(x, y - 20, w, 40); ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.strokeRect(x, y - 20, w, 40);
      ctx.fillStyle = P.ink; ctx.fillRect(x, y - 20, 22, 40);
      ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + 36, y + 1); ctx.restore();
    },
  };
}
