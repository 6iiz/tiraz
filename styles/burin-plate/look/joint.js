// The burin-plate joint: a leaf of a bound volume of plates is turned. The bound edge is on the reading side; the old leaf folds over
// toward it, foreshortening as it rises, and the next plate lies underneath, shaded near the fold.
import { ease } from '/engine/kit.js';

export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), k = Math.cos((q * Math.PI) / 2), w = Math.max(0, W * k);
      ctx.drawImage(to, 0, 0);
      if (w < 1) return;
      const x = rtl ? W - w : 0;                          // the leaf, still attached at the bound edge
      const g = ctx.createLinearGradient(rtl ? x - 60 : w + 60, 0, rtl ? x : w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.12 * Math.sin(Math.PI * q)})`);
      ctx.fillStyle = g; ctx.fillRect(rtl ? x - 60 : w, 0, 60, H);
      ctx.drawImage(from, x, 0, w, H);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(rtl ? x : x + w - 2, 0, 2, H);       // the leaf's edge
    },
  };
}
