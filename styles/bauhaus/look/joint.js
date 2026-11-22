// The Bauhaus joint: a circle opens from the top corner on the reading side and grows until it holds the whole next scene, its edge
// a thick accent ring. A circle, a straight path and a heavy ease: the system's own vocabulary, no fade.
import { palette, heavy } from './motion.js';

export function create({ W, H, brand, look }) {
  const P = palette(brand, look), rtl = brand.dir !== 'ltr', ox = rtl ? W : 0, oy = 0, R = Math.hypot(W, H) + 40;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const r = R * Math.min(1, heavy(p) * 0.97 + p * 0.03);
      if (r <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p < 1) { ctx.strokeStyle = P.accent; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.stroke(); }
    },
  };
}
