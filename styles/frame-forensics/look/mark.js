// The desk's clock: a thin rail above the safe area with the reel's own running timecode in the mono face and a tick that runs along
// the rail. The clock lives in the picture. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, tc, code } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, t = 0) {
      const y = 112, x0 = SAFE.left, x1 = SAFE.right;
      ctx.save();
      ctx.fillStyle = P.rule; ctx.fillRect(x0, y + 26, x1 - x0, 1);
      for (let k = 0; k <= 30; k++) ctx.fillRect(x0 + (x1 - x0) * k / 30, y + 20 + (k % 5 ? 3 : 0), 1, k % 5 ? 3 : 6);
      const u = (t % 30) / 30, hx = rtl ? x1 - (x1 - x0) * u : x0 + (x1 - x0) * u;
      ctx.fillStyle = P.mark; ctx.fillRect(hx - 1, y + 14, 2, 18);
      code(ctx, tc(t, look.tokens.fps), rtl ? x0 : x1, y, { mono, size: 22, color: P.grey, align: rtl ? 'left' : 'right' });
      code(ctx, brand.handle, rtl ? x1 : x0, y, { mono, size: 22, color: P.dim, align: rtl ? 'right' : 'left' });
      ctx.restore();
    },
  };
}
