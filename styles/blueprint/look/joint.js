// The blueprint joint: the next sheet is plotted over the last one. A 2 px accent pen sweeps across the frame from the reading side
// at an even drafting pace, with a short dimension tick at each end, and the new sheet is uncovered behind it. No fade.
import { inks, plot } from './motion.js';
export function create({ W, H, brand, look }) {
  const ink = inks(brand, look.tokens.tone), rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const r = W * plot(p);
      if (r <= 0) return;
      const x = rtl ? W - r : 0;
      ctx.drawImage(to, x, 0, r, H, x, 0, r, H);
      if (p >= 1) return;
      const xe = rtl ? x : r;
      ctx.fillStyle = ink.accent; ctx.fillRect(xe - 1, 0, 2, H);
      ctx.strokeStyle = ink.accent; ctx.lineWidth = 2;
      for (const y of [look.tokens.grid.border + 30, H - look.tokens.grid.border - 30]) {
        ctx.beginPath(); ctx.moveTo(xe - 9, y + 9); ctx.lineTo(xe + 9, y - 9); ctx.moveTo(xe - 22, y); ctx.lineTo(xe + 22, y); ctx.stroke();
      }
    },
  };
}
