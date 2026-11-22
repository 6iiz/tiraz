// The etched-celluloid joint: a needle tears down the strip. A jagged, slightly slanted seam crosses the frame from the reading side; behind
// it the next scene is already scratched. The seam glows thin (a cut line with a little dye beside it), so the frame is never lit as a whole.
import { rgba, rng } from '/engine/kit.js';

export async function create({ W, H, brand, look }) {
  const M = await import(look.base + 'motion.js'), P = M.palette(brand), rtl = brand.dir !== 'ltr';
  const r = rng(4242), base = [];
  for (let y = -40; y <= H + 40; y += 36) base.push([y, (r() - 0.5) * 46]);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2, X = rtl ? W + 140 - q * (W + 280) : -140 + q * (W + 280);
      const n = Math.floor(p * 8), j = rng((n * 97 + 3) >>> 0);
      const pts = base.map(([y, o]) => [X + o + (j() - 0.5) * 8 + (y / H - 0.5) * 140 * (rtl ? 1 : -1), y]);
      ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(rtl ? W + 400 : -400, H + 40); ctx.lineTo(rtl ? W + 400 : -400, -40); ctx.closePath(); ctx.clip();
      ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.save(); ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = rgba(P.dye, 0.5); ctx.lineWidth = 12; ctx.stroke();
      ctx.shadowColor = P.cream; ctx.shadowBlur = 16; ctx.strokeStyle = P.cream; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    },
  };
}
