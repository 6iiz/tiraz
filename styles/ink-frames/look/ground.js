// The ink-frames ground: the page. The brand's lighter colour is the paper and its darker colour the ink (whichever role the brand gave
// them), with a faint printed grain. Panels, tones and lines are drawn by each part, because the panel layout is the cut.
import { grain, palette } from './motion.js';

export function create({ W, H, brand }) {
  const P = palette(brand), g = grain(W, H, P.ink);
  return {
    P,
    draw(ctx) { ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H); ctx.drawImage(g, 0, 0); },
  };
}
