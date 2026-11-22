// The Empty Halls joint: the tape skips. A band of tracking noise rolls up the frame; above it the old recording, below it the new one,
// and the rows nearest the band are pulled sideways a little, as a worn tape does. The band is pale and thin, so nothing flashes.
import { rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, H, brand }) {
  const P = palette(brand), r = rng(31), band = 70;
  const noise = document.createElement('canvas'); noise.width = W / 3; noise.height = band; const g = noise.getContext('2d');
  for (let y = 0; y < band; y += 2) for (let x = 0; x < W / 3; x += 3) { const v = r(); g.fillStyle = v > 0.6 ? rgba(P.light, 0.25 + v * 0.2) : `rgba(0,0,0,${0.2 + v * 0.3})`; g.fillRect(x, y, 3, 2); }
  const io = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  return {
    draw(ctx, from, to, p) {
      const q = io(Math.min(1, Math.max(0, p))), yb = H + band - q * (H + 2 * band);     // the band's top edge
      const cut = Math.max(0, Math.min(H, yb));
      if (cut > 0) ctx.drawImage(from, 0, 0, W, cut, 0, 0, W, cut);
      if (cut < H) ctx.drawImage(to, 0, cut, W, H - cut, 0, cut, W, H - cut);
      for (let k = 0; k < 6; k++) {                                                    // torn rows just above the band
        const y = yb - 30 - k * 26, h = 22; if (y < 0 || y > H) continue;
        const dx = Math.sin(k * 2.3 + p * 31) * 26 * (1 - k / 6);
        ctx.drawImage(from, 0, y, W, h, dx, y, W, h);
      }
      if (yb < H && yb + band > 0) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(noise, (p * 977) % 3, 0, W / 3 - 3, band, 0, yb, W, band); ctx.restore(); }
    },
  };
}
