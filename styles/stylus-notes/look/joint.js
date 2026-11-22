// The Stylus Notes joint: two fingers on the glass. The canvas pinches out a little, pans one screen toward the reading end with a
// slight turn, and pinches back in on the next idea, which was already drawn further along the same canvas. Both pages move as one
// sheet; nothing fades and nothing flashes.
import { palette } from './motion.js';

export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), dir = brand.dir !== 'ltr' ? 1 : -1;
  const ease = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  return {
    draw(ctx, from, to, p) {
      const e = ease(p), pinch = 1 - 0.14 * Math.sin(Math.PI * p), turn = dir * 0.035 * Math.sin(Math.PI * p);
      ctx.fillStyle = pal.glass; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(pinch, pinch); ctx.rotate(turn);
      const gap = 0, off = dir * e * (W + gap);
      ctx.drawImage(from, -W / 2 + off, -H / 2);
      ctx.drawImage(to, -W / 2 + off - dir * (W + gap), -H / 2);
      ctx.restore();
    },
  };
}
