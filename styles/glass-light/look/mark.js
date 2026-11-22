// A quiet signature under the safe area: a short polished line of light and the handle in the mono face. Decoration only.
import { mix, rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(P.ground, P.ink, 0.5);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 560, cx = W / 2;
      const g = ctx.createLinearGradient(cx - 90, 0, cx + 90, 0);
      g.addColorStop(0, rgba(P.ink, 0)); g.addColorStop(0.5, rgba(P.ink, 0.55)); g.addColorStop(1, rgba(P.ink, 0));
      ctx.fillStyle = g; ctx.fillRect(cx - 90, y - 34, 180, 1.5);
      ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = c; ctx.fillText(brand.handle, cx, y);
    },
  };
}
