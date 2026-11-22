// The agit-cut ground: one printed sheet. The lighter of the brand's two colours is the paper, the darker the ink; a fixed paper fibre
// (built once from a seed) lies over it, and a single ink rule with a red rivet runs down the far margin like the edge of a film gate.
import { SAFE } from '/engine/kit.js';
import { palette, fibre } from './motion.js';

const cache = new Map();
export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr';
  const key = P.paper + P.ink; if (!cache.has(key)) cache.set(key, fibre(W, H, P));
  const tex = cache.get(key), x = rtl ? 30 : W - 36;
  return {
    P,
    draw(ctx, t) {
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.ink; ctx.fillRect(x, 0, 6, H);
      // sprocket holes on the gate edge, running with the reel's clock (two per beat)
      const off = ((t + clock) * 96) % 48;
      for (let y = -48 + off; y < H; y += 48) ctx.fillRect(x - 8, y, 22, 18);
      ctx.fillStyle = P.red; ctx.fillRect(x - 10, SAFE.top - 30, 26, 26);
      ctx.drawImage(tex, 0, 0);
    },
  };
}
