// The scale-dive joint: a dive through a ring. The old frame rushes outward past the lens while a ring of the pointer colour opens
// from a point in the middle; inside it the next frame grows from far away to full size. One continuous forward move, no fade.
import { clamp } from '/engine/kit.js';
import { palette, logLerp, Q, I } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), cx = W / 2, cy = H * 0.42, R = Math.hypot(W, H) * 0.62;
  return {
    draw(ctx, from, to, p) {
      const so = logLerp(1, 3, I(p));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(so, so); ctx.translate(-cx, -cy); ctx.drawImage(from, 0, 0); ctx.restore();
      const q = Q(clamp(p * 1.15)), r = R * q ** 1.6;
      if (r <= 1) return;
      const si = logLerp(0.35, 1, q);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
      ctx.translate(cx, cy); ctx.scale(si, si); ctx.translate(-cx, -cy); ctx.drawImage(to, 0, 0); ctx.restore();
      if (q < 1) {
        ctx.save(); ctx.lineWidth = 8; ctx.strokeStyle = pal.sun; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
        ctx.lineWidth = 4; ctx.setLineDash([2, 16]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r + 22, 0, 7); ctx.stroke(); ctx.restore();
      }
    },
  };
}
