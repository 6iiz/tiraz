// The retro-cel joint: the tape rolls. A tracking band climbs the frame from the bottom; under it the next scene is already playing,
// inside it the picture tears into strips that slip sideways with a pale hiss of noise, above it the old scene holds. Tonal: the
// band mixes the two pictures it passes over, so the frame's brightness hardly moves.
import { ease, rng, rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), bh = 260;
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), yb = H + bh - q * (H + bh * 2);    // the band's top edge
      ctx.drawImage(from, 0, 0);
      const below = Math.max(0, yb + bh);
      if (below < H) ctx.drawImage(to, 0, below, W, H - below, 0, below, W, H - below);
      const r = rng(31 + Math.floor(p * 30));
      for (let y = Math.max(0, yb); y < Math.min(H, yb + bh);) {
        const h = 6 + r() * 26, src = r() < 0.5 ? to : from, dx = (r() - 0.5) * 120;
        ctx.drawImage(src, 0, y, W, h, dx, y, W, h);
        if (r() < 0.45) { ctx.fillStyle = rgba(r() < 0.5 ? P.light : P.night, 0.12 + r() * 0.15); ctx.fillRect(0, y, W, Math.min(h, 4 + r() * 6)); }
        y += h;
      }
    },
  };
}
