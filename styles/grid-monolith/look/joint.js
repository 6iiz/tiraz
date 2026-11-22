// The grid-monolith joint: the next page slides in cell by cell along the grid, out of each cell's reading-side edge, the way a
// word leaves its gate. The cells go in a diagonal sweep from the reading side's top corner; each one locks with the precise curve.
import { SAFE } from '/engine/kit.js';
import { E } from './motion.js';
export function create({ W, H, brand, look }) {
  const G = look.tokens.grid, P = (SAFE.right - SAFE.left) / G.cols, rtl = brand.dir !== 'ltr';
  const i0 = -Math.ceil(SAFE.left / P), i1 = Math.ceil((W - SAFE.left) / P), j0 = -Math.ceil(SAFE.top / P), j1 = Math.ceil((H - SAFE.top) / P);
  const cells = [];
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) cells.push({ x: SAFE.left + i * P, y: SAFE.top + j * P, r: (rtl ? i1 - 1 - i : i - i0) + (j - j0) });
  const top = Math.max(...cells.map((c) => c.r));
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (const c of cells) {
        const q = E(Math.min(1, Math.max(0, p * 1.7 - (c.r / top) * 0.7)));
        if (q <= 0) continue;
        const x0 = Math.max(0, Math.floor(c.x)), x1 = Math.min(W, Math.ceil(c.x + P)), y0 = Math.max(0, Math.floor(c.y)), y1 = Math.min(H, Math.ceil(c.y + P));
        const w = Math.ceil((x1 - x0) * q); if (w <= 0 || y1 <= y0) continue;
        const sx = rtl ? x1 - w : x0;
        ctx.drawImage(to, sx, y0, w, y1 - y0, sx, y0, w, y1 - y0);
      }
    },
  };
}
