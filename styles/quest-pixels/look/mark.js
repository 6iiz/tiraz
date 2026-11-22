// Below the safe area: three pixel hearts (a game's health) and the handle in the mono face on a small dark plate. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, sprite, block } from './motion.js';
const HEART = ['.oo.oo.', 'occoLco', 'occccco', '.occco.', '..oco..', '...o...'];
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const map = { o: P.d, c: P.a, L: P.l };
  const m = document.createElement('canvas').getContext('2d'); m.font = `600 22px "${mono}"`;
  const tw = m.measureText(brand.handle).width, w = tw + 3 * 32 + 60;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 42, x0 = rtl ? SAFE.right - w : SAFE.left;
      block(ctx, x0, y - 12, x0 + w, y + 42, P.d);
      const hx = rtl ? SAFE.right - 3 * 32 - 12 : x0 + 18;
      for (let i = 0; i < 3; i++) sprite(ctx, HEART, hx + i * 32, y + 3, map, 4);
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.l; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? hx - 18 : hx + 3 * 32 + 18, y + 15); ctx.restore();
    },
  };
}
