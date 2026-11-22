// A small atomic sparkle and the handle in the mono face on the floor band, below the safe area. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, cel, sparkle } from './motion.js';
export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 50, x = SAFE.left + 14;
  const star = sparkle(x, y, 16);
  return {
    draw(ctx, t) {
      cel(ctx, star, { fill: P.accent, line: P.ink, width: 2.5, id: 300, t: t ?? 0, gaps: 0 });
      ctx.save(); ctx.fillStyle = P.ink; ctx.font = `700 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 30, y + 1); ctx.restore();
    },
  };
}
