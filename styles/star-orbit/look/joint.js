// The star-orbit joint: an eclipse. A dark world, lit on its leading limb, passes across the lens from the reading side; the next
// scene is already behind it. Tonal (the disc is the sky's own night), so it never floods the frame with light.
import { mix, rgba } from '/engine/kit.js';
import { palette } from './ground.js';
import { S } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', R = 1250;
  const limb = mix(P.sky, P.accent, 0.55), edge = mix(P.atmo, P.light, 0.2);
  return {
    draw(ctx, from, to, p) {
      const e = S(p), x0 = rtl ? W + R + 40 : -R - 40, x1 = rtl ? -R - 40 : W + R + 40, cx = x0 + (x1 - x0) * e, cy = H / 2;
      ctx.drawImage(to, 0, 0);
      ctx.save(); ctx.beginPath();
      if (rtl) ctx.rect(0, 0, Math.max(0, Math.min(W, cx)), H); else ctx.rect(Math.max(0, cx), 0, W, H);
      ctx.clip(); ctx.drawImage(from, 0, 0); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = P.deep; ctx.fill(); ctx.clip();
      const lx = cx + (rtl ? -1 : 1) * R * 0.92, g = ctx.createRadialGradient(lx, cy, R * 0.05, lx, cy, R * 0.7);
      g.addColorStop(0, rgba(limb, 0.55)); g.addColorStop(1, rgba(limb, 0));
      ctx.fillStyle = g; ctx.fillRect(cx - R, 0, R * 2, H); ctx.restore();
      ctx.save(); ctx.beginPath();
      const a = rtl ? Math.PI : 0; ctx.arc(cx, cy, R, a - 0.9, a + 0.9);
      ctx.strokeStyle = rgba(edge, 0.85); ctx.lineWidth = 5; ctx.shadowColor = rgba(edge, 0.8); ctx.shadowBlur = 24; ctx.stroke(); ctx.restore();
    },
  };
}
