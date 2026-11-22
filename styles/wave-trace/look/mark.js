// The readout row under the screen: a small run light that breathes, and the handle in the mono face. Decoration only.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 70, x = SAFE.left;
  return {
    draw(ctx, t) {
      ctx.save(); ctx.fillStyle = pal.beam; ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 2)); ctx.beginPath(); ctx.arc(x + 6, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.light, 0.5); ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
      ctx.fillText(brand.handle, x + 24, y + 1); ctx.restore();
    },
  };
}
