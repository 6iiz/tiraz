// A small sign below the safe area: a little accent starburst with an ink outline, and the handle beside it in the mono face.
// Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, burstPath } from './motion.js';

export async function create({ W, brand, look }) {
  const P = palette(brand, look), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const y = SAFE.bottom + 64, x = rtl ? SAFE.left + 22 : SAFE.right - 22, path = burstPath(x, y, 10, 10, 9, 9, 0.2);
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = P.accent; ctx.fill(path); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.lineJoin = 'miter'; ctx.stroke(path);
      ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.ink; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'left' : 'right'; ctx.fillText(brand.handle, rtl ? x + 34 : x - 34, y);
      ctx.restore();
    },
  };
}
