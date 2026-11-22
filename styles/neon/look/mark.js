// A small sign below the safe area: the handle in the mono face, dim, beside a tiny accent pilot light, as on the switch box of a
// neon sign. Decoration only: the app may cover it.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left, y = SAFE.bottom + 70;
  return {
    draw(ctx) {
      ctx.save();
      const g = ctx.createRadialGradient(x + 8, y, 0, x + 8, y, 22);
      g.addColorStop(0, rgba(pal.accent, 0.5)); g.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = g; ctx.fillRect(x - 14, y - 22, 44, 44);
      ctx.fillStyle = pal.hot.core; ctx.beginPath(); ctx.arc(x + 8, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.light, 0.55); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 30, y + 1);
      ctx.restore();
    },
  };
}
