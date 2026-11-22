// The cyanotype joint: a sheet of rinse water runs down the print. Above its wavy front the next print is already there; along the
// front a soft band of lighter water. Both prints are the same coating, so the frame's brightness holds through the cut.
import { rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand }) {
  const pal = palette(brand);
  const band = document.createElement('canvas'); band.width = W; band.height = 120;
  { const g = band.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, rgba(pal.white, 0)); gr.addColorStop(0.8, rgba(pal.white, 0.14)); gr.addColorStop(1, rgba(pal.white, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, 120); }
  const edge = (x, p) => Math.sin(x * 0.011 + p * 7) * 26 + Math.sin(x * 0.027 + 2 - p * 5) * 12;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2, y = -80 + q * (H + 160);
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0);
      for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, y + edge(x, p));
      ctx.closePath(); ctx.clip(); ctx.drawImage(to, 0, 0);
      ctx.drawImage(band, 0, y - 110); ctx.restore();
    },
  };
}
