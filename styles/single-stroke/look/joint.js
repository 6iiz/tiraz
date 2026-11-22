// The single-stroke joint: the paper is drawn along with the line. The camera pans with the nib towards the far side, so the page that
// ends slides away towards the reading side and the next page comes in from the far side; the line that left one page at the far
// edge is the line that enters the next at the same height, so the seam is one continuous stroke.
import { io } from './motion.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      const e = io(p), k = rtl ? 1 : -1;
      ctx.drawImage(from, k * W * e, 0);
      ctx.drawImage(to, k * W * (e - 1), 0);
    },
  };
}
