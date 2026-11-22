// The agit-cut joint: a split-screen cut. The frame is three horizontal strips; the next scene slams into them one strip per sixteenth,
// from alternate sides, each with an ink seam at its leading edge. Paper replaces paper, so the cut never flashes.
import { clamp } from '/engine/kit.js';
import { E, palette } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), n = 3, h = H / n, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (let i = 0; i < n; i++) {
        const q = clamp((p - i * 0.22) / 0.42); if (q <= 0) continue;
        const side = ((i % 2) ? -1 : 1) * (rtl ? 1 : -1), off = (1 - E(q)) * W * side, y = i * h;
        ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, h + 1); ctx.clip();
        ctx.drawImage(to, 0, y, W, h + 1, off, y, W, h + 1);
        if (q < 1) { ctx.fillStyle = P.ink; ctx.fillRect(side > 0 ? off - 14 : off + W, y, 14, h + 1); }
        ctx.restore();
      }
    },
  };
}
