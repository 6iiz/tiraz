// The agent-titles joint: the old picture is sliced into strips along a 30-degree cut and the strips slide off alternately along the
// cut, one after another, each with a paper shadow, uncovering the next location underneath. No dissolve, no flash.
import { clamp } from '/engine/kit.js';
import { I } from './motion.js';
export function create({ W, H, brand }) {
  const n = 6, a = (brand.dir !== 'ltr' ? 30 : -30) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const R = Math.hypot(W, H), bw = (R * 1.1) / n;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(to, 0, 0);
      for (let i = 0; i < n; i++) {
        const q = clamp((p - i * 0.07) / 0.6), off = I(q) * R * 1.05 * (i % 2 ? 1 : -1);
        if (q >= 1) continue;
        ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(a);
        const v0 = -R * 0.55 + i * bw;
        ctx.beginPath(); ctx.rect(-R + off, v0, R * 2, bw + 1); ctx.clip();
        if (q > 0) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-R + off + 6, v0 + 8, R * 2, bw); }
        ctx.rotate(-a); ctx.translate(off * ca, off * sa); ctx.drawImage(from, -W / 2, -H / 2);
        ctx.restore();
      }
    },
  };
}
