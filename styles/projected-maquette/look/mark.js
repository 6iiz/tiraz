// A small sign below the safe area: a scale bar (alternating segments, as on a model's base plate) beside the handle in the mono face.
// Decoration only: the app may cover it.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left, y = SAFE.bottom + 70;
  return {
    draw(ctx) {
      ctx.font = `500 22px "${mono}"`;
      ctx.fillStyle = rgba(pal.dark, 0.6); ctx.fillRect(x - 10, y - 18, 108 + ctx.measureText(brand.handle).width, 36);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? rgba(pal.light, 0.15) : rgba(pal.light, 0.6); ctx.fillRect(x + i * 17, y - 3, 17, 6); }
      ctx.fillStyle = rgba(pal.light, 0.6); ctx.fillRect(x, y - 9, 1.5, 18); ctx.fillRect(x + 68, y - 9, 1.5, 18);
      ctx.fillStyle = rgba(pal.light, 0.5); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 88, y + 1);
    },
  };
}
