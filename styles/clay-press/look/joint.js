// The clay joint: the next set is uncovered by a lumpy hole that grows from the middle of the table, as if a thumb pushed the old
// scene aside. It grows in poses (stop-motion), its edge wobbles differently on each pose, and it throws a soft shadow so the old
// scene reads as a thick sheet of clay lying over the new one.
import { POSE } from './motion.js';
export function create({ W, H }) {
  const cx = W / 2, cy = H * 0.4, R = Math.hypot(W, H) * 0.75;
  const blob = (ctx, r, k) => {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * Math.PI * 2;
      const w = 1 + 0.07 * Math.sin(a * 3 + k * 1.9) + 0.05 * Math.sin(a * 5 - k * 2.7) + 0.03 * Math.sin(a * 9 + k);
      const x = cx + Math.cos(a) * r * w, y = cy + Math.sin(a) * r * w;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  };
  return {
    draw(ctx, from, to, p, info = {}) {
      const n = 5, k = Math.ceil(p * n - 1e-6), q = k / n;           // five poses across the joint
      if (q <= 0) { ctx.drawImage(from, 0, 0); return; }
      if (q >= 1) { ctx.drawImage(to, 0, 0); return; }
      ctx.drawImage(from, 0, 0);
      const r = R * q * q * (3 - 2 * q) + 40;
      ctx.save(); blob(ctx, r, k); ctx.clip(); ctx.drawImage(to, 0, 0);
      ctx.restore();
      ctx.save();                                                     // the old sheet's thick lip, shading the new set inside the hole
      blob(ctx, r, k); ctx.rect(W * 3, -H, -W * 5, H * 3); ctx.clip('evenodd');
      ctx.shadowColor = 'rgba(30,18,8,0.32)'; ctx.shadowBlur = 34; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 16;
      ctx.drawImage(from, 0, 0); ctx.restore();
    },
  };
}
