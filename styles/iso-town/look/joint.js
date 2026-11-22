// The iso-town joint: the next page of the pop-up book folds down over the old one, hinged on the top edge, with a soft shade under
// the fold that fades as the page lies flat. Calm and without a flash: both pages are the same paper.
import { ease } from '/engine/kit.js';
export function create({ W, H }) {
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p); if (q <= 0) return;
      const h = H * q;
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, Math.min(H, h + 40 * (1 - q)));
      ctx.drawImage(to, 0, 0, W, H, 0, 0, W, h);
      if (q < 1) { const g = ctx.createLinearGradient(0, h - 120, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${(0.18 * (1 - q)).toFixed(3)})`); ctx.fillStyle = g; ctx.fillRect(0, h - 120, W, 120); }
    },
  };
}
