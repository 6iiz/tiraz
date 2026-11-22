// A small isometric cube in the accent and the handle in the mono face, below the safe area. Decoration only: the app may cover it.
import { mix, SAFE } from '/engine/kit.js';
import { project, block, palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(brand.colors.text, brand.colors.bg, 0.45);
  const y = SAFE.bottom + 70, P = project(SAFE.left + 14, y - 16, 9);
  return {
    draw(ctx) {
      block(ctx, P, 0, 0, 0, 1.6, 1.6, 1.6, pal.hot);
      ctx.save(); ctx.fillStyle = c; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, SAFE.left + 44, y - 2); ctx.restore();
    },
  };
}
