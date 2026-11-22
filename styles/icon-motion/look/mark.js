// Broadcast chrome below the safe area: a strip of nine small ticks, one of them in the accent and stepping one place along on every
// beat, and the handle in the mono face beside it. Decoration only: the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette, BEAT } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr', y = 1284;
  return {
    draw(ctx, t = 0) {
      const k = Math.floor(Math.max(0, t) / BEAT) % 9, x0 = rtl ? SAFE.right - 9 * 16 : SAFE.left;
      for (let i = 0; i < 9; i++) { ctx.fillStyle = i === (rtl ? 8 - k : k) ? P.acc : P.rule; ctx.beginPath(); ctx.roundRect(x0 + i * 16, y - 10, 8, 20, 4); ctx.fill(); }
      ctx.save(); ctx.fillStyle = P.grey; ctx.font = `600 22px "${mono}"`; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x0 - 20 : x0 + 9 * 16 + 20, y); ctx.restore();
    },
  };
}
