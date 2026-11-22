// A tiny house beside the handle in the mono face, on a paper chip below the safe area, like a page mark in a picture book. Decoration.
import { SAFE } from '/engine/kit.js';
import { palette, project, house } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 330, x = rtl ? SAFE.right - 24 : SAFE.left + 24;
      ctx.save(); ctx.font = `600 22px "${mono}"`; const tw = ctx.measureText(brand.handle).width;
      ctx.fillStyle = pal.paper; ctx.beginPath(); ctx.roundRect(rtl ? x - tw - 70 : x - 34, y - 32, tw + 104, 56, 28); ctx.fill();
      house(ctx, project(x - 4, y - 26, 7), 3, 3, 2.2, 1.4, pal.walls[0], pal.roofs[0], { glass: pal.glass, windows: 0 });
      ctx.fillStyle = pal.muted; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 34 : x + 34, y - 4); ctx.restore();
    },
  };
}
