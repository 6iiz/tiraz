// The sumi joint: a bank of mist rises up the paper. Above its soft front the old page still shows; below it the new page is already
// there, so the scenes are exchanged inside the mist. The mist is the paper's own colour, so the cut never flashes.
import { rgba } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const { bg, text } = brand.colors;
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
  const paper = lum(bg) >= lum(text) ? bg : text, band = 520;
  const fog = document.createElement('canvas'); fog.width = W; fog.height = band;
  const g = fog.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, band);
  gr.addColorStop(0, rgba(paper, 0)); gr.addColorStop(0.45, rgba(paper, 0.96)); gr.addColorStop(0.55, rgba(paper, 0.96)); gr.addColorStop(1, rgba(paper, 0));
  g.fillStyle = gr; g.fillRect(0, 0, W, band);
  // a few wisps on the fog's edges, so it is not a ruler-straight band
  for (let i = 0; i < 18; i++) {
    const x = (i * 137) % W, y = (i % 2 ? 0.25 : 0.75) * band, rx = 140 + (i * 53) % 120, w = g.createRadialGradient(x, y, 0, x, y, rx);
    w.addColorStop(0, rgba(paper, 0.6)); w.addColorStop(1, rgba(paper, 0));
    g.save(); g.translate(x, y); g.scale(1, 0.35); g.translate(-x, -y); g.fillStyle = w; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore();
  }
  return {
    draw(ctx, from, to, p) {
      const q = p * p * (3 - 2 * p), front = H + band / 2 - q * (H + band);   // the middle of the fog
      ctx.drawImage(from, 0, 0);
      const y = Math.max(0, Math.min(H, front));
      if (y < H) ctx.drawImage(to, 0, y, W, H - y, 0, y, W, H - y);
      ctx.drawImage(fog, 0, front - band / 2);
    },
  };
}
