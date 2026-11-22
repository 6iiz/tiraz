// The Ink Cutaway ground: a drawing sheet. The brand's lighter colour is the paper, with a faint 40 px drafting grid (every fifth line a
// shade firmer), a ruled sheet border with zone ticks along its edges, and a small registration cross that drifts along the top border
// so the sheet is never quite still. Painted once to its own canvas.
import { mix } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
  for (let k = 0, x = 20; x < W; x += 40, k++) { g.fillStyle = k % 5 ? pal.faint : mix(pal.paper, pal.ink, 0.11); g.fillRect(x, 0, 1, H); }
  for (let k = 0, y = 20; y < H; y += 40, k++) { g.fillStyle = k % 5 ? pal.faint : mix(pal.paper, pal.ink, 0.11); g.fillRect(0, y, W, 1); }
  const m = 34;
  g.strokeStyle = pal.ink; g.lineWidth = 3; g.strokeRect(m, m, W - 2 * m, H - 2 * m);
  g.lineWidth = 1; g.strokeRect(m + 10, m + 10, W - 2 * m - 20, H - 2 * m - 20);
  g.fillStyle = pal.ink;
  for (let x = m + 135; x < W - m; x += 135) { g.fillRect(x, m, 1.5, 10); g.fillRect(x, H - m - 10, 1.5, 10); }
  for (let y = m + 160; y < H - m; y += 160) { g.fillRect(m, y, 10, 1.5); g.fillRect(W - m - 10, y, 10, 1.5); }
  return {
    pal,
    draw(ctx, t) {
      ctx.drawImage(cv, 0, 0);
      const x = 120 + (((t + clock) * 22) % (W - 240));
      ctx.save(); ctx.strokeStyle = pal.grey; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x - 12, m + 24); ctx.lineTo(x + 12, m + 24); ctx.moveTo(x, m + 12); ctx.lineTo(x, m + 36); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, m + 24, 6, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    },
  };
}
