// The terrain-story joint: a pass through the haze. A soft band in the sky's own light colour sweeps down the frame; above it the next
// scene is already there, under it the last one still stands, and inside the band the two dissolve into each other. Tonal, no flash.
import { rgba } from '/engine/kit.js';
import { palette, outC } from './motion.js';
export function create({ W, H, brand }) {
  const pal = palette(brand), band = 360, strips = 12;
  return {
    draw(ctx, from, to, p) {
      const y = -band + (H + band * 2) * outC(p);
      ctx.drawImage(from, 0, 0);
      if (y > 0) { const h = Math.min(H, y); ctx.drawImage(to, 0, 0, W, h, 0, 0, W, h); }
      for (let k = 0; k < strips; k++) {
        const y0 = y + (k * band) / strips, h = band / strips + 1; if (y0 >= H || y0 + h <= 0) continue;
        const a = 1 - (k + 0.5) / strips, ys = Math.max(0, y0), hs = Math.min(H, y0 + h) - ys; if (hs <= 0) continue;
        ctx.save(); ctx.globalAlpha = a; ctx.drawImage(to, 0, ys, W, hs, 0, ys, W, hs); ctx.restore();
      }
      if (p > 0 && p < 1) { const g = ctx.createLinearGradient(0, y - 40, 0, y + band); g.addColorStop(0, rgba(pal.light, 0)); g.addColorStop(0.4, rgba(pal.light, 0.35)); g.addColorStop(1, rgba(pal.light, 0)); ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, band + 40); }
    },
  };
}
