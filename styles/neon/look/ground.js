// The neon ground: a dark wall in the brand's darker colour, laid in faint bricks (each a hair lighter than the mortar, its tone from
// rng), drawn once. While a sign is lit, its light spills onto the wall: spill() lays a soft pool of a tube's colour behind it, at the
// sign's brightness. The wall itself never moves.
import { rgba, mix, rng } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T);
  const wall = document.createElement('canvas'); wall.width = W; wall.height = H;
  {
    const c = wall.getContext('2d'), r = rng(4242), bw = 150, bh = 58, m = 4;
    c.fillStyle = pal.dark; c.fillRect(0, 0, W, H);
    for (let row = 0, y = 0; y < H; row++, y += bh) {
      for (let x = row % 2 ? -bw / 2 : 0; x < W; x += bw) {
        c.fillStyle = mix(pal.dark, pal.light, T.tone.brick * (0.4 + r() * 0.9));
        c.fillRect(x + m / 2, y + m / 2, bw - m, bh - m);
      }
    }
    for (let i = 0; i < 2600; i++) { c.fillStyle = rgba(pal.light, 0.012 + r() * 0.02); c.fillRect(r() * W, r() * H, 2, 2); }
    // the wall falls off into the dark toward its edges
    const g = c.createRadialGradient(W / 2, H * 0.4, H * 0.2, W / 2, H * 0.4, H * 0.75);
    g.addColorStop(0, rgba(pal.dark, 0)); g.addColorStop(1, rgba(pal.dark, 0.9)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  const pools = {};
  const pool = (colour) => {
    if (pools[colour]) return pools[colour];
    const s = 900, c = document.createElement('canvas'); c.width = s; c.height = s; const g = c.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, rgba(colour, 1)); gr.addColorStop(0.4, rgba(colour, 0.4)); gr.addColorStop(1, rgba(colour, 0));
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return (pools[colour] = c);
  };
  pool(pal.accent); pool(pal.light);
  return {
    pal,
    draw(ctx) { ctx.drawImage(wall, 0, 0); },
    // a pool of light w x h centred on (x, y), in a tube's colour, at brightness b
    spill(ctx, x, y, w, h, colour, b) {
      if (b <= 0.02) return;
      ctx.save(); ctx.globalAlpha = b * T.tone.spill; ctx.drawImage(pool(colour), x - w / 2, y - h / 2, w, h); ctx.restore();
    },
  };
}
