// The field-notebook joint: the view sinks. The plate rises out of the top of the frame, its cutaway of the earth passing up through
// the frame, and the next plate rises in from below behind it, as if the eye went down through the soil to the next page.
import { ease } from '/engine/kit.js';
export function create({ W, H }) {
  return {
    draw(ctx, from, to, p) {
      const o = ease.inOutCubic(p) * H;
      ctx.drawImage(from, 0, -o);
      ctx.drawImage(to, 0, H - o);
    },
  };
}
