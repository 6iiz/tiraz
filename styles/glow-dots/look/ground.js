// The glow-dots ground: a summer night in the darker brand colour, nothing else lit but points. A few large, faint discs float far
// out of focus; nearer, fireflies drift slowly upward on wavering paths and blink, most of them dark at any moment. A very soft pool
// of warmth sits behind the middle of the frame where the words gather. The motes are seeded once and placed by the reel's time
// (`clock`), so the night carries on across scenes instead of restarting.
import { rgba, rng } from '/engine/kit.js';
import { palette, sprite, disc } from './motion.js';

const cache = new Map();
export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T);
  const id = [W, H, brand.colors.bg, brand.colors.text, brand.colors.accent].join('|');
  if (!cache.has(id)) {
    const r = rng(2718), motes = [];
    for (let i = 0; i < T.motes; i++) {
      const far = r() < 0.16;
      motes.push({ far, x: r() * W, y: r() * (H + 300), v: far ? 4 + r() * 6 : 10 + r() * 22, A: 20 + r() * 50, f: 0.2 + r() * 0.6, ph: r() * 6.283,
        bf: 0.6 + r() * 1.4, s: far ? 50 + r() * 90 : 7 + r() * 11, warm: r() < 0.4, a: far ? 0.03 + r() * 0.05 : 0.5 + r() * 0.5 });
    }
    const pool = document.createElement('canvas'); pool.width = W; pool.height = H;
    const g = pool.getContext('2d');
    g.fillStyle = pal.night; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(W / 2, 760, 40, W / 2, 760, 900);
    gr.addColorStop(0, rgba(pal.warm, 0.07)); gr.addColorStop(1, rgba(pal.warm, 0));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    cache.set(id, { motes, pool });
  }
  const { motes, pool } = cache.get(id);
  const sLight = sprite(pal.glow, pal.glow), sWarm = sprite(pal.spark, pal.glow), dLight = disc(pal.glow), dWarm = disc(pal.spark);
  return {
    pal,
    draw(ctx, t, dim = 1) {
      const time = t + clock;
      ctx.drawImage(pool, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        const y = ((m.y - m.v * time) % (H + 300) + H + 300) % (H + 300) - 150, x = m.x + m.A * Math.sin(m.f * time + m.ph);
        let a = m.a * dim;
        if (!m.far) a *= Math.max(0, Math.sin(m.bf * time + m.ph)) ** 6;       // a firefly is dark most of the time
        else a *= 0.7 + 0.3 * Math.sin(m.bf * 0.3 * time + m.ph);
        if (a < 0.01) continue;
        ctx.globalAlpha = a;
        const sp = m.far ? (m.warm ? dWarm : dLight) : (m.warm ? sWarm : sLight);
        ctx.drawImage(sp, x - m.s / 2, y - m.s / 2, m.s, m.s);
      }
      ctx.restore();
    },
  };
}
