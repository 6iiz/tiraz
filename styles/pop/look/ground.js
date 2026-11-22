// The pop ground: the brand's light colour printed over with Ben-Day dots in a pale tint of the accent. The dots are small in the
// middle of the frame and swell toward the edges, like a cheap comic print; the whole screen drifts slowly on a diagonal. It is built
// once, offscreen, a repeat larger than the frame so it can drift without a seam, and uses `clock` so it never jumps at a cut.
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, D = T.dots, P = palette(brand, look), c = D.cell;
  const cv = document.createElement('canvas'); cv.width = W + c; cv.height = H + 2 * c;
  const g = cv.getContext('2d'); g.fillStyle = P.dots;
  const R = Math.hypot(W / 2, H / 2);
  for (let j = 0, y = 0; y < H + c * 2; j++, y += c * 0.866) {
    for (let x = (j % 2) * c / 2; x < W + c * 2; x += c) {
      const f = Math.min(1, Math.hypot(x - W / 2, y - H / 2) / R) ** 1.6, r = c * (D.min + (D.max - D.min) * f);
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }
  return {
    P, paper: P.paper, ink: P.ink,
    draw(ctx, t) {
      const time = t + clock, wrap = (v, m) => ((v % m) + m) % m, ox = wrap(time * D.drift, c), oy = wrap(time * D.drift * 0.8, c * 1.732);
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(cv, -ox, -oy);
    },
  };
}
