// The two-tone joint: the next scene comes through the ordered dither over the whole frame, level by level on the 15 fps grid,
// so for a moment the two scenes are interleaved dot by dot. Two inks only, so the cut never flashes a new tone.
import { dissolve, FPS } from './motion.js';
export function create({ W, H }) {
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = Math.floor(p * 6 + 1e-6) / 6;                           // six visible steps across the joint
      dissolve(ctx, q, [0, 0, W, H], (c) => c.drawImage(to, 0, 0));
    },
  };
}
