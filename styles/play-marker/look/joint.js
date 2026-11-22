// The Play Marker joint: the studio sting. A slanted accent band crosses the frame from the reading side with a thin light band
// running ahead of it; behind the band the next scene is already there. Hard edges, no fade.
import { ease } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', slope = 0.32, band = 230;
  const edge = (x0, y) => x0 + (rtl ? -1 : 1) * (y - H / 2) * slope;          // the slanted edge through (x0, middle)
  return {
    draw(ctx, from, to, p) {
      const span = W + band + H * slope + 80, e = ease.inOutCubic(p), lead = rtl ? W + H * slope / 2 + 40 - span * e : -H * slope / 2 - 40 + span * e;
      const s = rtl ? 1 : -1;                                                  // the band's trailing side
      const poly = (a, b) => { ctx.beginPath(); ctx.moveTo(edge(a, 0), 0); ctx.lineTo(edge(b, 0), 0); ctx.lineTo(edge(b, H), H); ctx.lineTo(edge(a, H), H); ctx.closePath(); };
      ctx.drawImage(from, 0, 0);
      ctx.save(); poly(lead + s * band, lead + s * (W + H)); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p > 0 && p < 1) {
        ctx.fillStyle = P.accent; poly(lead, lead + s * band); ctx.fill();
        ctx.fillStyle = P.light; poly(lead - s * 30, lead - s * 16); ctx.fill();
      }
    },
  };
}
