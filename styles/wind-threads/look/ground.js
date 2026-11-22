// The wind-threads ground: warm chart paper (the lighter brand colour) with a fine fibre, a dotted graticule printed in a pale ink,
// and over it the threads of a steady wind blowing from the reading side, with darker strokes running along them. A part gives the
// ground its own threads (the text it places is an obstacle, so they part round it); without them the ground prints free-stream
// threads. Paper, graticule and free threads are built once per brand; the strokes run on the reel's time (`clock`).
import { rgba, rng, mix } from '/engine/kit.js';
import { palette, field, threads, comets } from './motion.js';

const cache = new Map();
export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), rtl = brand.dir !== 'ltr';
  const id = [W, H, brand.colors.bg, brand.colors.text, brand.colors.accent, rtl].join('|');
  if (!cache.has(id)) {
    const paper = document.createElement('canvas'); paper.width = W; paper.height = H;
    const g = paper.getContext('2d'), r = rng(505);
    g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) {                                  // fibre: short pale hairs and specks
      g.strokeStyle = rgba(r() < 0.5 ? pal.ink : '#ffffff', 0.025 + r() * 0.03); g.lineWidth = 1;
      const x = r() * W, y = r() * H, a = r() * Math.PI, l = 3 + r() * 14;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.fillStyle = pal.grat;                                         // the graticule: dotted meridians and parallels
    for (let x = 90; x < W; x += 225) for (let y = 0; y < H; y += 9) g.fillRect(x + Math.sin(y / 600) * 18, y, 2, 2);
    for (let y = 150; y < H; y += 225) for (let x = 0; x < W; x += 9) g.fillRect(x, y + Math.sin(x / 500) * 10, 2, 2);
    const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, H * 0.8);
    vg.addColorStop(0, rgba(pal.ink, 0)); vg.addColorStop(1, rgba(pal.ink, 0.08));
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    const free = threads({ W, H, pal, T, v: field({ W, H, rtl, seed: 9 }), seed: 4 });
    cache.set(id, { paper, free });
  }
  const { paper, free } = cache.get(id);
  return {
    pal, rtl,
    threads: (obstacles, seed = 7, extra = {}) => threads({ W, H, pal, T, v: field({ W, H, rtl, seed: 9, obstacles, ...extra }), obstacles, seed }),
    draw(ctx, t, TH = free, { gusts = [], rate = 1, alpha = 1 } = {}) {
      ctx.drawImage(paper, 0, 0);
      if (alpha > 0) { ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(TH.cv, 0, 0); ctx.restore(); }
      comets(ctx, TH, t + clock, pal, { gusts, rate, alpha });
    },
  };
}
