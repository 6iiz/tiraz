// The squiggle-box joint: a wavy pastel band with an ink outline and a row of dots sweeps across the frame from the reading side,
// and the new scene is behind it. The band's edges are sine squiggles that keep wriggling as it travels. Tonal: the band is a pastel
// mix of the paper, so the frame's brightness hardly moves.
import { mix } from '/engine/kit.js';
import * as M from './motion.js';
export function create({ W, H, brand }) {
  const P = M.palette(brand), rtl = brand.dir !== 'ltr', band = 120, steps = 48;
  const edge = (x, y, ph) => x + Math.sin(y * 0.02 + ph) * 18 + Math.sin(y * 0.047 + ph * 1.7) * 8;
  const path = (ctx, xa, xb, ph) => {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) { const y = (i / steps) * (H + 40) - 20, x = edge(xa, y, ph); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    for (let i = steps; i >= 0; i--) { const y = (i / steps) * (H + 40) - 20; ctx.lineTo(edge(xb, y, ph + 2), y); }
    ctx.closePath();
  };
  const fill = mix(P.paper, P.accent, 0.35);
  return {
    draw(ctx, from, to, p) {
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2, travel = W + band * 2 + 80;
      const lead = rtl ? W + band + 40 - travel * e : -band - 40 + travel * e;     // the band's leading edge
      const trail = rtl ? lead + band : lead - band;
      ctx.drawImage(from, 0, 0);
      // the new scene is behind the band: everything the band has passed
      ctx.save(); path(ctx, trail, rtl ? W + 400 : -400, p * 6); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.save(); path(ctx, lead, trail, p * 6); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
      ctx.clip(); ctx.fillStyle = P.ink;
      const mid = (lead + trail) / 2;
      for (let y = 30; y < H; y += 46) { ctx.beginPath(); ctx.arc(edge(mid, y, p * 6 + 1), y, 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    },
  };
}
