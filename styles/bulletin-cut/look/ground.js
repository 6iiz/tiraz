// The bulletin ground: the studio wall behind the graphics. The brand's lighter colour, printed with a dot-matrix map (land as larger
// dots, sea as faint ones), sliding very slowly sideways through the whole reel, like the wall of a newsroom set. Built once per scene;
// the slide uses `clock`, so it never restarts at a cut.
import { SAFE } from '/engine/kit.js';
import { palette, noise } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), n = noise(7731), X = 420;
  const cv = document.createElement('canvas'); cv.width = W + X; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = P.paper; g.fillRect(0, 0, cv.width, cv.height);
  const step = 22;
  for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < cv.width; x += step) {
    const v = n(x * 0.0042, y * 0.0042 + 3);
    if (v > 0.52) { g.fillStyle = P.dot; g.beginPath(); g.arc(x, y, v > 0.6 ? 4.2 : 3.4, 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = P.dotLo; g.fillRect(x - 1, y - 1, 2, 2); }
  }
  // the set's two horizon rules, above the panel and under the safe area
  g.fillStyle = P.dot; g.fillRect(0, T.panel.y - 28, cv.width, 2); g.fillRect(0, SAFE.bottom + 18, cv.width, 2);
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(cv, -Math.min(X, time * T.drift), 0);
    },
  };
}
