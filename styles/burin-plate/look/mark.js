// An oval cartouche at the middle of the engine-turned band at the head of the plate, holding the brand's logo, as a plate carries its
// maker's device. Decoration only, above the safe area.
import { palette } from './motion.js';

export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), cx = W / 2, cy = 175;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = P.paper; ctx.beginPath(); ctx.ellipse(cx, cy, 62, 44, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, 54, 36, 0, 0, Math.PI * 2); ctx.stroke();
      brand.logo.draw(ctx, cx - 22, cy - 22, 44, P.ink);
      ctx.restore();
    },
  };
}
