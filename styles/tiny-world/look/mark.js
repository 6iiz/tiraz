// A little model label below the safe area, as on the edge of a tabletop town: a dark plate with the handle in the mono face. Decoration.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; const w = ctx.measureText(brand.handle).width + 36, h = 40, y = SAFE.bottom + 60;
      const x = rtl ? SAFE.right - w : SAFE.left;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 4, y + 4, w, h); ctx.fillStyle = pal.ink; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? x + w - 8 : x, y, 8, h);
      ctx.fillStyle = pal.paper; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + w / 2 + (rtl ? -4 : 4), y + h / 2 + 1); ctx.restore();
    },
  };
}
