// The stud-builder joint: a wall of bricks in a tone close to the desk is built over the old scene, course by course from the bottom,
// in held poses (the wall changes only ten times across the joint); then it is taken down from the top, course by course, uncovering
// the new scene behind it. Each course is painted once on its own strip.
import { mix } from '/engine/kit.js';
import * as M from './motion.js';

export function create({ W, H, brand }) {
  const P = M.palette(brand), ch = 96, n = Math.ceil(H / ch) + 1, lift = 60;
  const tones = [mix(P.bg, P.text, 0.1), mix(P.bg, P.text, 0.16), mix(P.bg, P.accent, 0.22)];
  const courses = [];
  for (let j = 0; j < n; j++) {                                  // course j counted from the bottom of the frame
    const cv = document.createElement('canvas'); cv.width = W; cv.height = ch + lift + 30;
    const g = cv.getContext('2d');
    let x = j % 2 ? -ch : -ch * 0.4, k = j * 3;
    while (x < W) { const w = ch * (k % 3 === 0 ? 2.4 : k % 3 === 1 ? 1.6 : 3.2); M.put(g, M.piece(P, w - 2, ch, tones[(k * 7 + j) % 3], { pitch: ch * 0.8 }), x, lift); x += w; k++; }
    courses.push({ cv, y: H - (j + 1) * ch - lift });
  }
  return {
    draw(ctx, from, to, p) {
      const q = Math.floor(p * 10 + 1e-6) / 10;
      const count = q < 0.5 ? Math.ceil(n * q / 0.5) : Math.ceil(n * (1 - (q - 0.5) / 0.5));
      ctx.drawImage(q < 0.5 ? from : to, 0, 0);
      for (let j = 0; j < Math.min(n, count); j++) ctx.drawImage(courses[j].cv, 0, courses[j].y);   // lower first: each course covers the studs below
    },
  };
}
