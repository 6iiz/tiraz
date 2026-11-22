// The stick-talk joint: the page pans sideways to the next idea, the way an explainer moves along a long sheet. The finished frame
// slides out toward the end of the reading direction and the next one slides in after it; the system line runs through both, so the
// people seem to walk on along the same ground. Tonal by construction: paper follows paper.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', s = rtl ? 1 : -1;
  return {
    draw(ctx, from, to, p) {
      const x = Math.round(W * ease.inOutCubic(p)) * s;
      ctx.drawImage(from, x, 0); ctx.drawImage(to, x - s * W, 0);
    },
  };
}
