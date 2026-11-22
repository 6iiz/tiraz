// A single small brick of the accent and the handle in the mono face, just under the safe area on the reading side. Decoration only.
import { SAFE, mix } from '/engine/kit.js';
import * as M from './motion.js';
export async function create({ W, brand }) {
  const P = M.palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const pc = M.piece(P, 34, 24, P.accent, { pitch: 30, deep: 10 }), y = SAFE.bottom + 40, x = rtl ? SAFE.right - 34 : SAFE.left;
  const c = mix(P.text, P.bg, 0.35);
  return {
    draw(ctx) {
      M.put(ctx, pc, x, y - 12);
      ctx.save(); ctx.fillStyle = c; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 14 : x + 48, y + 1); ctx.restore();
    },
  };
}
