// The grid-motion ground: a full flood of the brand's accent (pulled toward a readable tone when the brand's ink would not read on
// it) and a modular grid of four columns and 96 px rows ruled in a tone of the ink, with a small registration cross on every fourth
// row. The grid is one picture made once; what moves on this ground is always type, never the ground itself.
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const G = look.tokens.grid, pal = palette(brand);
  const colW = (W - 2 * G.margin - (G.cols - 1) * G.gutter) / G.cols;
  const cols = []; for (let i = 0; i < G.cols; i++) { const x0 = G.margin + i * (colW + G.gutter); cols.push([x0, x0 + colW]); }
  const sheet = document.createElement('canvas'); sheet.width = W; sheet.height = H;
  const c = sheet.getContext('2d');
  c.fillStyle = pal.ground; c.fillRect(0, 0, W, H);
  c.fillStyle = pal.line;
  for (const [a, b] of cols) { c.fillRect(a - 1, 0, 2, H); c.fillRect(b - 1, 0, 2, H); }
  for (let y = G.row; y < H; y += G.row) c.fillRect(0, y - 1, W, 2);
  c.fillStyle = pal.soft;
  for (let y = G.row * 2; y < H; y += G.row * 4) for (const [a, b] of cols) for (const x of [a, b]) { c.fillRect(x - 9, y - 1.5, 18, 3); c.fillRect(x - 1.5, y - 9, 3, 18); }
  return {
    pal, cols, colW,
    draw(ctx) { ctx.drawImage(sheet, 0, 0); },
  };
}
