// A map-margin tag below the safe area: a small set of contour rings with a lit dot, and the handle in the mono face, on a strip of
// the sky's colour so it reads over the terrain. Decoration only.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = 1832, x = SAFE.left + 4;
  return {
    draw(ctx, t) {
      ctx.save(); ctx.font = `500 22px "${mono}"`; const w = ctx.measureText(brand.handle).width;
      ctx.fillStyle = rgba(pal.light, 0.82); ctx.fillRect(x - 12, y - 24, w + 70, 48);
      ctx.strokeStyle = rgba(pal.dark, 0.55); ctx.lineWidth = 1.5;
      for (const r of [5, 10, 15]) { ctx.beginPath(); ctx.ellipse(x + 16, y, r * 1.2, r * 0.8, 0.3, 0, 6.283); ctx.stroke(); }
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(x + 16, y, 3 + Math.sin(t * 2) * 0.8, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(pal.dark, 0.7); ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
      ctx.fillText(brand.handle, x + 44, y + 1); ctx.restore();
    },
  };
}
