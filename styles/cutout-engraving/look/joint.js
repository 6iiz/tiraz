// The cut-out joint: a large torn sheet of pale accent paper is drawn across the table by hand, on twos, from the reading side; it
// covers the old collage as it passes and the new one is already laid out behind it. Its torn edges carry the white fibre fringe.
import { rng } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', band = 420, r = rng(404);
  const lead = [], tail = []; for (let y = -20; y <= H + 20; y += 24) { lead.push([(r() - 0.5) * 34, y]); tail.push([(r() - 0.5) * 34, y]); }
  const edge = (c, x0, pts, rev) => { (rev ? [...pts].reverse() : pts).forEach(([x, y]) => c.lineTo(x0 + x, y)); };
  return {
    draw(ctx, from, to, p) {
      const q = Math.floor(p * 12 * 0.45 + 1e-6) / (12 * 0.45);           // on twos over a 0.45 s joint
      const e = q < 0.5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2;
      const travel = W + band + 80, s = rtl ? -1 : 1;
      const front = rtl ? W + 40 - travel * e : -40 + travel * e, back = front - s * band;   // the sheet spans back..front
      ctx.drawImage(from, 0, 0);
      // behind the sheet's back edge the new collage is already there
      ctx.save(); ctx.beginPath();
      if (rtl) { ctx.moveTo(W + 60, -20); edge(ctx, back, tail, false); ctx.lineTo(W + 60, H + 20); }
      else { ctx.moveTo(-60, -20); edge(ctx, back, tail, false); ctx.lineTo(-60, H + 20); }
      ctx.closePath(); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (q <= 0 || q >= 1) return;
      const sheet = (c, inset) => { c.beginPath(); c.moveTo(back + tail[0][0], -20); edge(c, front - s * inset, lead, false); edge(c, back + s * inset, tail, true); c.closePath(); };
      ctx.save(); ctx.translate(14 * s, 0); ctx.filter = 'blur(10px)'; ctx.fillStyle = P.shadow; sheet(ctx, 0); ctx.fill(); ctx.restore();
      ctx.fillStyle = P.paper; sheet(ctx, 0); ctx.fill();
      ctx.fillStyle = P.sheet; sheet(ctx, 7); ctx.fill();
    },
  };
}
