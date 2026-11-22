// The Parts Apart joint: the old frame comes apart like the device does. It is cut into horizontal slabs that move away from the
// middle on the one vertical axis (the outer slabs travel furthest) and dim as they go, uncovering the next scene, which settles from
// a slight push-in. Tonal throughout: both scenes stand on the same studio ground.
import { E } from './motion.js';
export function create({ W, H }) {
  const n = 6, h = H / n;
  return {
    draw(ctx, from, to, p) {
      const q = E(p), z = 1.04 - 0.04 * q;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); ctx.drawImage(to, 0, 0); ctx.restore();
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n - 0.5, lag = Math.abs(k) * 0.25, pi = E(Math.min(1, Math.max(0, (p - (0.25 - lag)) / 0.75)));
        if (pi >= 1) continue;
        ctx.save(); ctx.globalAlpha = 1 - pi;
        ctx.drawImage(from, 0, i * h, W, h + 1, 0, i * h + k * 2 * H * 0.55 * pi, W, h + 1);
        ctx.restore();
      }
    },
  };
}
