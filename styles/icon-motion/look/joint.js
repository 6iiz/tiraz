// The Icon Motion joint: every row of the frame is a lane. In each lane a strip of three pattern cells shoots across from the reading
// side, a little out of step with its neighbours; ahead of the strip is the old scene, behind it the new one. The frame is never fully
// covered, so its brightness hardly moves: rows shift, the page changes.
import { palette, sheet, row } from './motion.js';
import { clamp } from '/engine/kit.js';
export async function create({ W, H, brand, look }) {
  const C = look.tokens.cell, n = Math.ceil(H / C), P = palette(brand), sh = sheet(P, W, C, n, 9), rtl = brand.dir !== 'ltr';
  const Wd = C * 3, lag = Array.from({ length: n }, (_, r) => ((r * 7) % n) / n * 0.32);
  const io = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  return {
    draw(ctx, from, to, p) {
      for (let r = 0; r < n; r++) {
        const y = r * C, h = Math.min(C, H - y), q = io(clamp((p - lag[r]) / 0.68));
        const travel = W + Wd, e = rtl ? W - q * travel : -Wd + q * travel;        // the strip's left edge
        // old scene ahead of the strip, new scene behind it
        const [ax, aw] = rtl ? [0, Math.max(0, e)] : [Math.min(W, e + Wd), Math.max(0, W - e - Wd)];
        const [bx, bw] = rtl ? [Math.min(W, e + Wd), Math.max(0, W - e - Wd)] : [0, Math.max(0, e)];
        if (aw > 0) ctx.drawImage(from, ax, y, aw, h, ax, y, aw, h);
        if (bw > 0) ctx.drawImage(to, bx, y, bw, h, bx, y, bw, h);
        if (e < W && e + Wd > 0) {
          ctx.save(); ctx.beginPath(); ctx.rect(e, y, Wd, h); ctx.clip();
          row(ctx, sh, r, y, e, C, W); ctx.restore();
        }
      }
    },
  };
}
