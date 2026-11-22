// The Swiss joint: the next page is uncovered column by column from the reading side, each column a hard-edged strip that lands
// with the precise ease a sixteenth after the one before it. No fade, no blur: paper replaces paper.
import { E } from './motion.js';
export function create({ W, H, brand, look }) {
  const G = look.tokens.grid, n = G.cols + 2, w = W / n, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (let i = 0; i < n; i++) {
        const k = rtl ? n - 1 - i : i, q = E(Math.min(1, Math.max(0, p * 1.6 - i * (0.6 / n))));
        if (q <= 0) continue;
        const x = k * w, h = H * q;
        ctx.drawImage(to, x, 0, w + 1, h, x, 0, w + 1, h);
      }
    },
  };
}
