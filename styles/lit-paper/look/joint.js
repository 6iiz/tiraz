// The lit-paper joint: a new sheet is slid into the box from below. A band of dark card with cloud-scalloped edges (lamp light on its
// upper rim, a soft shadow under it) rises through the frame; above it the old scene, below it the new one.
import { rgba } from '/engine/kit.js';
import { palette, sheet, cloudRect } from './motion.js';
const sm = (p) => p * p * (3 - 2 * p);
export function create({ W, H, brand }) {
  const P = palette(brand), bh = 360, S = sheet(W + 40, bh + 80, cloudRect(0, 40, W + 40, bh, 34), P.l3, rgba(P.glow, 0.85), 57, 18);
  return {
    draw(ctx, from, to, p) {
      const q = sm(Math.min(1, Math.max(0, p))), yTop = H + 40 - (H + bh + 120) * q, split = Math.round(Math.max(0, Math.min(H, yTop + bh / 2 + 40)));
      ctx.drawImage(from, 0, 0);
      if (split < H) ctx.drawImage(to, 0, split, W, H - split, 0, split, W, H - split);
      ctx.save(); ctx.globalAlpha = 0.8; ctx.drawImage(S.shadow, -20, yTop + 24); ctx.restore();
      ctx.drawImage(S.img, -20, yTop);
    },
  };
}
