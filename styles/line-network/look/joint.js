// The line-network joint: a fresh sheet is laid over the last one. It slides in from the reading side with its own soft shadow and
// stops; the old sheet stays still under it. No colour floods the frame: what passes is paper.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.outCubic(p), x = (rtl ? 1 : -1) * (1 - q) * (W + 60);
      if (q <= 0) return;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = rtl ? -10 : 10;
      ctx.fillStyle = '#000'; ctx.fillRect(x, 0, W, H); ctx.restore();
      ctx.drawImage(to, x, 0);
    },
  };
}
