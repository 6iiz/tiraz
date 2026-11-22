// A survey tag below the safe area: a small cluster of returns that twinkles as the sweep passes, and the handle in the mono face.
// Decoration only.
import { rgba, rng, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 190, x = SAFE.left + 4;
  const r = rng(31), dots = Array.from({ length: 14 }, () => [r() * 22, r() * 22 - 11, r()]);
  return {
    draw(ctx, t) {
      ctx.save(); ctx.font = `500 22px "${mono}"`; const w = ctx.measureText(brand.handle).width;
      ctx.fillStyle = rgba(pal.dark, 0.8); ctx.fillRect(x - 10, y - 20, w + 60, 40);
      for (const [dx, dy, j] of dots) { ctx.fillStyle = rgba((t * 0.7 + j) % 1 < 0.15 ? pal.key : pal.light, 0.6); ctx.fillRect(x + dx, y + dy, 3, 3); }
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.light, 0.5); ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
      ctx.fillText(brand.handle, x + 38, y + 1); ctx.restore();
    },
  };
}
