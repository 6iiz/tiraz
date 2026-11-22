// The chart-tale joint: the chart itself never cuts (it is drawn from the reel's time), so only the notes change. The new page is
// uncovered by a sweep that travels the way time runs on the chart, its edge a soft pencil-grey shade, like a hand wiping a slate.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p); if (q <= 0) return;
      const w = (W + 160) * q, x = rtl ? W - w : 0;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, w, H); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (q < 1) {
        const e = rtl ? x : w, g = ctx.createLinearGradient(e - 40, 0, e + 40, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(e - 40, 0, 80, H);
      }
    },
  };
}
