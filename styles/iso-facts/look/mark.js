// A small tag at the foot of the frame, below the safe area: a tiny accent cube and the handle in the mono face on a pale pill, like
// the scale note on a diagram. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette, project, block } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = 1858, x = rtl ? SAFE.right - 10 : SAFE.left + 10;
      ctx.save(); ctx.font = `600 22px "${mono}"`; const tw = ctx.measureText(brand.handle).width;
      ctx.fillStyle = pal.card; ctx.beginPath(); ctx.roundRect(rtl ? x - tw - 66 : x - 10, y - 24, tw + 76, 48, 24); ctx.fill();
      block(ctx, project(rtl ? x - 24 : x + 24, y - 2, 11), 0, 0, 0, 1, 1, 1, pal.hot, { shade: false });
      ctx.fillStyle = pal.muted; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 46 : x + 46, y + 1); ctx.restore();
    },
  };
}
