// The travel-print joint: the next scene is printed over the last one by a single pull from the top of the frame to the bottom. The
// squeegee's blade and bead ride the ragged wet front; the new sheet is opaque, so nothing fades.
import { palette, PULL } from './motion.js';
const tooth = (x) => 6 * Math.sin(x * 0.041 + 1.3) + 3 * Math.sin(x * 0.13 + 0.4) + 2 * Math.sin(x * 0.33 + 2.2);
export function create({ W, H, brand }) {
  const P = palette(brand);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const f = -40 + (H + 80) * PULL(p);
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(W, -50);
      for (let x = W; x >= 0; x -= 12) ctx.lineTo(x, f + tooth(x));
      ctx.closePath(); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p > 0 && p < 1) {
        ctx.fillStyle = P.ghost; ctx.fillRect(0, f + 10, W, 10);
        ctx.fillStyle = P.blade; ctx.fillRect(0, f - 2, W, 13);
        ctx.fillStyle = P.ink; ctx.fillRect(0, f - 9, W, 6);
      }
    },
  };
}
