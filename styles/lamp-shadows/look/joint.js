// The lamp-shadows joint: a tall lattice flat of dyed hide is carried across the screen from the reading side, like the scenery of a
// shadow play; the next scene is already on the cloth behind it. Laid in multiply, as light through hide.
import { palette, lattice } from './motion.js';
const sm = (p) => p * p * (3 - 2 * p);
export function create({ W, H, brand }) {
  const P = palette(brand), pw = Math.round(W * 0.6), panel = lattice(pw, H, P), rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      const q = sm(Math.min(1, Math.max(0, p))), cx = rtl ? W + pw / 2 - (W + pw) * q : -pw / 2 + (W + pw) * q;
      ctx.drawImage(from, 0, 0);
      const x = Math.round(Math.max(0, Math.min(W, cx)));
      if (rtl && x < W) ctx.drawImage(to, x, 0, W - x, H, x, 0, W - x, H);
      if (!rtl && x > 0) ctx.drawImage(to, 0, 0, x, H, 0, 0, x, H);
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(panel, cx - pw / 2, 0); ctx.restore();
    },
  };
}
