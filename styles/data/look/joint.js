// The data joint: a reading cursor, a 2 px accent line with a small marker, crosses the frame from the reading side and leaves the next
// scene behind it, as a cursor scrubs along a chart.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', accent = brand.colors.accent;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p), w = W * q;
      if (w <= 0) return;
      const x = rtl ? W - w : 0;
      ctx.drawImage(to, x, 0, w, H, x, 0, w, H);
      if (q < 1) {
        const cx = rtl ? x : w;
        ctx.fillStyle = accent; ctx.fillRect(cx - 1, 0, 2, H);
        ctx.beginPath(); ctx.arc(cx, H * 0.36, 8, 0, Math.PI * 2); ctx.fill();
      }
    },
  };
}
