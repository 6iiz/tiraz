// The neon joint: a power cut. The outgoing wall stutters and goes dark, and the next one comes up out of the dark, where its own
// signs then ignite. The wall is dark either side of the cut, so the change is small in light: nothing flashes.
import { rgba } from '/engine/kit.js';
import { palette, douse } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens);
  return {
    draw(ctx, from, to, p) {
      if (p < 0.5) {
        ctx.drawImage(from, 0, 0);
        const b = douse(p / 0.5, 13);
        ctx.fillStyle = rgba(pal.dark, 0.9 * (1 - b)); ctx.fillRect(0, 0, W, H);
      } else {
        ctx.drawImage(to, 0, 0);
        ctx.fillStyle = rgba(pal.dark, 0.9 * (1 - (p - 0.5) / 0.5)); ctx.fillRect(0, 0, W, H);
      }
    },
  };
}
