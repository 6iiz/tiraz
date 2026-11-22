// The wax world's joint: the camera trucks sideways to the next stop in the same world, in stepped drawings (seven for the move), so
// the horizon runs on unbroken from one scene into the next. It moves the way the reader's eye goes next.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const dir = brand.dir !== 'ltr' ? 1 : -1;
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(Math.round(p * 7) / 7), x = Math.round(dir * W * q);
      ctx.drawImage(from, x, 0); ctx.drawImage(to, x - dir * W, 0);
    },
  };
}
