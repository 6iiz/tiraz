// The tangible-data ground: a seamless studio sweep in the brand's lighter colour. It is a touch darker at the top and on the floor, so a
// pool of key light (a soft, slow-moving lighter area from the reading side) reads on it; a light vignette and a fine grain sit on top.
// The sweep, vignette and grain are built once; only the light pool moves, on `clock`, so it does not jump at a cut.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), rtl = brand.dir !== 'ltr', k = T.tone.sweep;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const lin = g.createLinearGradient(0, 0, 0, H);
  lin.addColorStop(0, mix(P.light, P.dark, k * 1.1)); lin.addColorStop(0.42, mix(P.light, P.dark, k * 0.45));
  lin.addColorStop(0.6, mix(P.light, P.dark, k * 0.6)); lin.addColorStop(1, mix(P.light, P.dark, k * 1.5));
  g.fillStyle = lin; g.fillRect(0, 0, W, H);
  const vig = g.createRadialGradient(W / 2, H * 0.45, W * 0.35, W / 2, H * 0.5, H * 0.75);
  vig.addColorStop(0, rgba('#000000', 0)); vig.addColorStop(1, rgba('#000000', 0.14));
  g.fillStyle = vig; g.fillRect(0, 0, W, H);
  const r = rng(2207);
  for (let i = 0; i < 30000; i++) { g.fillStyle = rgba(r() < 0.5 ? P.dark : P.light, 0.035 * (0.5 + r())); g.fillRect(r() * W, r() * H, 1.5, 1.5); }
  return {
    palette: P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(cv, 0, 0);
      const cx = (rtl ? W * 0.68 : W * 0.32) + Math.sin(time * 0.21) * 90, cy = H * 0.4 + Math.cos(time * 0.17) * 50;
      const pool = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.75);
      pool.addColorStop(0, rgba(P.light, 0.75)); pool.addColorStop(1, rgba(P.light, 0));
      ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);
    },
  };
}
