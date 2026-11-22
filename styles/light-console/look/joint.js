// The light-console joint: a scan plane re-projects the frame. A hot horizontal line sweeps down the frame; above it the next scene is
// already projected, below it the old one remains, and a narrow band just behind the line is slipped sideways in slices, as a
// projection settles. The line is thin, so the frame's brightness hardly changes: nothing flashes.
import { rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), r = rng(5), jit = Array.from({ length: 12 }, () => (r() - 0.5) * 60);
  return {
    draw(ctx, from, to, p) {
      const q = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2, y = q * (H + 160) - 80, band = 120;
      ctx.drawImage(from, 0, 0);
      if (y > 0) ctx.drawImage(to, 0, 0, W, Math.min(H, y), 0, 0, W, Math.min(H, y));
      for (let s = 0; s < 6; s++) {
        const y0 = y - band + (s * band) / 6, h = band / 6; if (y0 < 0 || y0 > H) continue;
        ctx.drawImage(to, 0, y0, W, h, jit[(s + Math.floor(p * 20)) % 12] * (1 - s / 6), y0, W, h);
      }
      ctx.fillStyle = rgba(pal.hue, 0.22); ctx.fillRect(0, y - 6, W, 12);
      ctx.fillStyle = pal.hot; ctx.fillRect(0, y - 1, W, 2);
    },
  };
}
