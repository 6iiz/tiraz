// Below the safe area: the handle in the mono face between two small lozenges, like a reel's leader label at the foot of the screen.
// Decoration only: the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette, diamond } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 78;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(brand.handle).width;
      ctx.globalAlpha = 0.7; ctx.fillStyle = P.dim; ctx.fillText(brand.handle, W / 2, y);
      diamond(ctx, W / 2 - w / 2 - 22, y, 5, P.flourish); diamond(ctx, W / 2 + w / 2 + 22, y, 5, P.flourish);
      ctx.restore();
    },
  };
}
