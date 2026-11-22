// The sitcom's joint: a portal. It swirls open in the middle of the frame with a springy overshoot and grows until the next scene,
// seen through it, fills the frame; its lumpy accent rim and the spiral arms boil and turn as it passes.
import { ease, clamp } from '/engine/kit.js';
import { palette, boilPath, ellipse, drawing, portal } from './motion.js';
export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), cx = W / 2, cy = H * 0.42, R = Math.hypot(W, H) * 0.62;
  return {
    draw(ctx, from, to, p, info = {}) {
      const t = info.t ?? p, k = drawing(t);
      ctx.drawImage(from, 0, 0);
      const a = clamp(p / 0.3), b = clamp((p - 0.3) / 0.7);
      if (b <= 0) { portal(ctx, P, cx, cy, 150 * ease.outBack(a), t, k); return; }
      const r = 150 + (R - 150) * ease.inOutCubic(b), rim = ellipse(cx, cy, r, r, 9, 0.05, t * 2);
      ctx.save(); boilPath(ctx, rim, true, k, 2, 5); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (b < 1) { boilPath(ctx, rim, true, k, 2, 5); ctx.strokeStyle = P.accent; ctx.lineWidth = 34; ctx.stroke(); ctx.strokeStyle = P.line; ctx.lineWidth = 8; ctx.stroke(); }
    },
  };
}
