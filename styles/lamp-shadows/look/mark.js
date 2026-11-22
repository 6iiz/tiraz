// A small oil lamp on the stage boards below the screen, its flame flickering, with the handle beside it in the mono face. Decoration only.
import { rgba, SAFE } from '/engine/kit.js';
import { palette, flick } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx, t) {
      const x = SAFE.left + 26, y = 1470, f = flick(t);
      ctx.save();
      const g = ctx.createRadialGradient(x, y - 26, 2, x, y - 26, 70); g.addColorStop(0, rgba(P.screen, 0.22 + 0.08 * f)); g.addColorStop(1, rgba(P.screen, 0));
      ctx.fillStyle = g; ctx.fillRect(x - 70, y - 96, 140, 140);
      ctx.fillStyle = P.wood2; ctx.beginPath(); ctx.ellipse(x, y, 24, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 6, y - 14, 12, 14);
      ctx.fillStyle = P.dye; ctx.beginPath(); const h = 22 + 4 * f; ctx.moveTo(x, y - 14 - h); ctx.quadraticCurveTo(x + 9, y - 22, x, y - 14); ctx.quadraticCurveTo(x - 9, y - 22, x, y - 14 - h); ctx.fill();
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(P.light, 0.5); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 44, y - 12);
      ctx.restore();
    },
  };
}
