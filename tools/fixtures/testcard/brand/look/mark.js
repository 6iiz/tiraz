// A small persistent mark with no duration of its own: the handle, bottom left inside the safe area. Used as "over" in a sequence.
import { font, SAFE } from '/engine/kit.js';

export async function create({ brand }) {
  return {
    draw(ctx) {
      ctx.font = font(500, 30, brand.fonts.mono.family); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = brand.colors.text; ctx.fillText(brand.handle, SAFE.left, SAFE.bottom - 10);
    },
  };
}
