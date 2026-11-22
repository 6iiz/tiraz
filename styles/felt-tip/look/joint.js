// The felt-tip joint: the finished sheet is peeled off the pad. A fold line travels from the lower far corner toward the upper reading
// corner; past it the next sheet is already there, and the lifted part of the old sheet lies folded back over itself, showing its plain
// back with a narrow, light shadow along the fold.
import { ease } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr';
  const C = [rtl ? 0 : W, H], far = [rtl ? W : 0, 0], L = Math.hypot(far[0] - C[0], far[1] - C[1]);
  const u = [(far[0] - C[0]) / L, (far[1] - C[1]) / L], v = [-u[1], u[0]], cu = C[0] * u[0] + C[1] * u[1];
  // a half-plane s < f (s = distance along u from C), as a big quad
  const half = (ctx, f, lo, hi) => {
    const p = (s, k) => [C[0] + u[0] * s + v[0] * k, C[1] + u[1] * s + v[1] * k], B = L * 2;
    const q = [p(lo, -B), p(hi, -B), p(hi, B), p(lo, B)];
    ctx.beginPath(); q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  };
  return {
    draw(ctx, from, to, p) {
      const f = ease.inOutCubic(p) * L;
      ctx.drawImage(to, 0, 0);
      if (f >= L) return;
      ctx.save(); half(ctx, f, f, L * 3); ctx.clip(); ctx.drawImage(from, 0, 0);
      if (f > 0) {                                                       // the shadow on the old sheet along the fold
        const g = ctx.createLinearGradient(C[0] + u[0] * f, C[1] + u[1] * f, C[0] + u[0] * (f + 60), C[1] + u[1] * (f + 60));
        g.addColorStop(0, 'rgba(0,0,0,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      if (f <= 0) return;
      // the flap: the lifted part reflected across the fold, its back showing
      const k = 2 * (cu + f);
      ctx.save(); ctx.transform(1 - 2 * u[0] * u[0], -2 * u[0] * u[1], -2 * u[0] * u[1], 1 - 2 * u[1] * u[1], k * u[0], k * u[1]);
      half(ctx, f, -L * 3, f); ctx.clip(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      ctx.fillStyle = P.back; ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(C[0] + u[0] * f, C[1] + u[1] * f, C[0] + u[0] * (f - 120), C[1] + u[1] * (f - 120));
      g.addColorStop(0, 'rgba(0,0,0,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0.04)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  };
}
