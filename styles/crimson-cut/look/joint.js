// The crimson-cut joint: the old sheet is peeled off. It lifts and swings up and away about its far top corner, casting a soft shadow
// on the new sheet underneath, which was there all along.
import { clamp } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(to, 0, 0);
      const q = clamp(p) ** 1.6; if (q >= 1) return;
      const px = rtl ? 0 : W, a = (rtl ? 1 : -1) * q * 1.1, lift = q * H * 0.5;
      ctx.save(); ctx.translate(px, -lift); ctx.rotate(a);
      ctx.fillStyle = 'rgba(0,0,0,' + (0.3 * Math.min(1, q * 4)) + ')'; ctx.fillRect(rtl ? 10 : -W - 10, 24, W, H);
      ctx.drawImage(from, rtl ? 0 : -W, 0);
      ctx.restore();
    },
  };
}
