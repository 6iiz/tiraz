// Under the safe area, on the stage floor: the handle in the mono face on a small light tag with a dark outline. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, toon, rect } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const m = document.createElement('canvas').getContext('2d'); m.font = `700 22px "${mono}"`; const w = m.measureText(brand.handle).width + 36;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 110, x = rtl ? SAFE.right - w : SAFE.left;
      toon(ctx, rect(x, y - 20, w, 40, 20), P.l, P, 5, 4);
      ctx.save(); ctx.font = `700 22px "${mono}"`; ctx.fillStyle = P.d; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + w / 2, y + 1); ctx.restore();
    },
  };
}
