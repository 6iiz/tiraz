// A small 1-bit tab below the safe area: ink with a one-dot paper frame, a blinking block cursor and the handle in the mono face.
// Decoration only. The cursor blinks on the 15 fps grid.
import { SAFE } from '/engine/kit.js';
import { palette, DOT } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, t) {
      const y = SAFE.bottom + 84;
      ctx.save(); ctx.font = `600 22px "${mono}"`;
      const tw = Math.ceil(ctx.measureText(brand.handle).width / DOT) * DOT, w = tw + 18 * DOT, x = rtl ? SAFE.left : SAFE.right - w;
      ctx.fillStyle = P.paper; ctx.fillRect(x, y - 24, w, 48); ctx.fillStyle = P.ink; ctx.fillRect(x + DOT, y - 24 + DOT, w - 2 * DOT, 48 - 2 * DOT);
      ctx.fillStyle = P.paper; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(brand.handle, x + 4 * DOT, y + 1);
      if (Math.floor((t ?? 0) * 2) % 2 === 0) ctx.fillRect(x + 6 * DOT + tw, y - 12, 3 * DOT, 24);
      ctx.restore();
    },
  };
}
