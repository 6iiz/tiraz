// The Blob World ground: a printed paper board lying on a table, seen from above. The board is the brand's lighter colour with a fine
// printed grid (every fourth line a little stronger), a few registration crosses and a faint paper tooth; the table around it is a
// shade darker. The board is drawn once per scene into its own canvas. The sprites of the Pips are built here too, once.
import { rng } from '/engine/kit.js';
import { palette, sprites } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const B = look.tokens.board, P = palette(brand), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(77), i0 = B.inset;
  g.fillStyle = P.table; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,0.10)'; g.beginPath(); g.roundRect(i0 + 4, i0 + 10, W - 2 * i0, H - 2 * i0, 22); g.fill();
  g.fillStyle = P.paper; g.beginPath(); g.roundRect(i0, i0, W - 2 * i0, H - 2 * i0, 22); g.fill();
  g.save(); g.beginPath(); g.roundRect(i0, i0, W - 2 * i0, H - 2 * i0, 22); g.clip();
  const c = B.cell, ox = (W % c) / 2;
  for (let k = 0, x = ox; x < W; k++, x += c) { g.fillStyle = k % B.major ? P.grid : P.gridB; g.fillRect(x - 1, 0, k % B.major ? 1.5 : 2.5, H); }
  for (let k = 0, y = 0; y < H; k++, y += c) { g.fillStyle = k % B.major ? P.grid : P.gridB; g.fillRect(0, y - 1, W, k % B.major ? 1.5 : 2.5); }
  for (let n = 0; n < 14000; n++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)'; g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
  g.strokeStyle = P.gridB; g.lineWidth = 3;
  for (const [x, y] of [[i0 + 50, i0 + 50], [W - i0 - 50, i0 + 50], [i0 + 50, H - i0 - 50], [W - i0 - 50, H - i0 - 50]]) {
    g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 16, y); g.moveTo(x, y - 16); g.lineTo(x, y + 16); g.stroke(); g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.stroke();
  }
  g.restore();
  const spr = sprites(P);
  return {
    P, spr, board: cv, time: (t) => t + clock,
    draw(ctx) { ctx.drawImage(cv, 0, 0); },
  };
}
