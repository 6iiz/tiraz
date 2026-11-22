// The single-stroke ground: warm paper (the lighter brand colour, a touch warmed by the ink) with soft mottling, a sparse tooth of
// specks and a faint vignette, all built once. Nothing else lives on it: the line is the only thing that moves.
import { rng, rgba } from '/engine/kit.js';
import { inks } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, K = inks(brand, T);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(2603);
  g.fillStyle = K.warm; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {           // mottling: large soft blots a shade lighter or darker
    const x = r() * W, y = r() * H, rad = 260 + r() * 360, light = r() < 0.5;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba(light ? K.paper : K.ink, light ? 0.035 : 0.006)); gr.addColorStop(1, rgba(light ? K.paper : K.ink, 0));
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 9000; i++) { g.fillStyle = rgba(K.ink, 0.02 + r() * 0.035); g.fillRect(r() * W, r() * H, 1 + r(), 1 + r()); }
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, H * 0.85);
  v.addColorStop(0, rgba('#000000', 0)); v.addColorStop(1, rgba('#000000', 0.07));
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return { K, draw(ctx) { ctx.drawImage(cv, 0, 0); } };
}
