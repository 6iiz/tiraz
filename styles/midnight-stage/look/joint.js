// The midnight-stage joint: the house curtains close from both wings, meet in the middle, and open again on the next scene. The
// velvet is dark and dyed with the accent, close to the stage's own darkness, so the frame does not flash.
import { palette, velvet } from './motion.js';
export function create({ W, H, brand }) {
  const pal = palette(brand), half = velvet(W / 2 + 30, H, pal, 60);
  const io = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  return {
    draw(ctx, from, to, p) {
      const shut = p < 0.5 ? io(p * 2) : 1 - io((p - 0.5) * 2);
      ctx.drawImage(p < 0.5 ? from : to, 0, 0);
      const w = (W / 2 + 30) * shut;
      if (w <= 0) return;
      ctx.drawImage(half, half.width - w, 0, w, H, 0, 0, w, H);
      ctx.drawImage(half, 0, 0, w, H, W - w, 0, w, H);
    },
  };
}
