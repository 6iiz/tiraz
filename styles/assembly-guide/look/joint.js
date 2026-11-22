// The assembly-guide joint: the manual's magnifier. A ringed circle opens from the build at the foot of the page and grows until the
// next step fills the frame; its ink ring is the edge. Paper replaces paper, so the frame's brightness hardly moves.
import { inks } from './motion.js';
export function create({ W, H, brand, look }) {
  const K = inks(brand, look.tokens), cx = W / 2, cy = look.tokens.rigY - 40, R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p), r = R * q;
      if (r <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (q < 1) { ctx.save(); ctx.strokeStyle = K.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    },
  };
}
