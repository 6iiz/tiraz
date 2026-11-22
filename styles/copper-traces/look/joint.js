// The copper-traces joint: a bus of four lit traces, with one 45-degree jog, sweeps across the frame from the reading side, and the
// next board is uncovered behind it. The front is current, not a colour flood: it covers a narrow strip at any moment.
import { ease } from '/engine/kit.js';
import * as M from './motion.js';
export function create({ W, H, brand, look }) {
  const P = M.palette(brand, look.tokens), rtl = brand.dir !== 'ltr', jog = 140, yj = H * 0.46;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p), s = rtl ? 1 : -1;
      const x = rtl ? W + jog + 40 - q * (W + jog + 80) : -jog - 40 + q * (W + jog + 80);
      const front = [[x, -20], [x, yj], [x - s * jog, yj + jog], [x - s * jog, H + 20]];
      ctx.save(); ctx.beginPath();
      ctx.moveTo(front[0][0], front[0][1]); for (const pt of front.slice(1)) ctx.lineTo(pt[0], pt[1]);
      ctx.lineTo(rtl ? W + 400 : -400, H + 20); ctx.lineTo(rtl ? W + 400 : -400, -20); ctx.closePath(); ctx.clip();
      ctx.drawImage(to, 0, 0); ctx.restore();
      if (p <= 0 || p >= 1) return;
      for (const pts of M.bus(front, 4, 22)) { const R = M.route(pts); M.trace(ctx, R, P, 8); M.glow(ctx, R, P, 0, R.total, 8, 0.9); }
    },
  };
}
