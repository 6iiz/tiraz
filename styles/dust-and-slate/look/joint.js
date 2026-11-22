// The slate's joint: the board is wiped. A broad wet-felt pass runs across from the reading side; behind its ragged edge the next board
// is already there, and a pale smear of the old writing trails just behind the edge before it dries away. Tonal, never a flash.
import { ease, rng } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', r = rng(77), n = 24, wob = Array.from({ length: n + 1 }, () => (r() - 0.5) * 70);
  const edgePath = (ctx, x, keepNew) => {                 // a ragged vertical edge at x; the region on the "new" side of it
    ctx.beginPath();
    const far = keepNew === rtl ? W + 200 : -200;
    ctx.moveTo(far, -10);
    for (let i = 0; i <= n; i++) ctx.lineTo(x + wob[i] + Math.sin(i * 1.7) * 18, (i / n) * (H + 20) - 10);
    ctx.lineTo(far, H + 10); ctx.closePath();
  };
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p), run = W + 420, x = rtl ? W + 210 - run * q : -210 + run * q;
      ctx.save(); edgePath(ctx, x, true); ctx.clip(); ctx.drawImage(to, 0, 0);
      // the smear: the old board, faint, in a band just behind the edge
      const band = 220, bx = rtl ? x : x - band;
      ctx.beginPath(); ctx.rect(bx, 0, band, H); ctx.clip();
      ctx.globalAlpha = 0.18 * (1 - q * 0.5); ctx.drawImage(from, rtl ? 14 : -14, 4);
      ctx.restore();
    },
  };
}
