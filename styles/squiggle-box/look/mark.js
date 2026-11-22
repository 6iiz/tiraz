// Three tiny Memphis marks (dot, triangle, zigzag) and the handle in the mono face, just under the safe area. Decoration only.
import { SAFE, mix } from '/engine/kit.js';
import * as M from './motion.js';
export async function create({ W, brand }) {
  const P = M.palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 44, x = rtl ? SAFE.right - 12 : SAFE.left + 12, c = mix(P.ink, P.paper, 0.35);
  return {
    draw(ctx) {
      [[0, P.accent], [1, P.pastel], [2, P.ink]].forEach(([k, col], i) => M.mark(ctx, P, k, rtl ? x - i * 26 : x + i * 26, y, 16, col));
      ctx.save(); ctx.fillStyle = c; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 78 : x + 78, y + 1); ctx.restore();
    },
  };
}
