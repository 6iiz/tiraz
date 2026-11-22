// A technical note below the safe area: the handle in the mono face, small and grey, with a 1 px rule above it. Decoration only.
import { mix, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(brand.colors.text, brand.colors.bg, 0.5);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 70;
      ctx.fillStyle = c; ctx.fillRect(SAFE.left, y - 30, 160, 1.5);
      ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(brand.handle, SAFE.left, y);
    },
  };
}
