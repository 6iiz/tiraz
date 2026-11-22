// The evidence-table ground: a glass light table in the brand's lighter colour, lit from below (a brighter pool that wanders very
// slowly), a faint diffuser grid, and the edges of other evidence lying around the reading area: a strip of negatives across the top,
// two slide mounts and a measuring rule at the foot, all outside the safe area. Everything is drawn once; per frame only the light pool
// moves and the loose objects drift a few pixels, as if the camera breathed over the table. Uses `clock`.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette, film, shade, noShade } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), rtl = brand.dir !== 'ltr';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

  const [base, b] = mk(W, H);
  b.fillStyle = P.table; b.fillRect(0, 0, W, H);
  b.fillStyle = rgba(P.ink, T.tone.grid);
  for (let x = 30; x < W; x += 60) b.fillRect(x, 0, 1, H);
  for (let y = 30; y < H; y += 60) b.fillRect(0, y, W, 1);
  const v = b.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.45, H * 0.75);
  v.addColorStop(0, rgba(P.ink, 0)); v.addColorStop(1, rgba(P.ink, T.tone.vignette));
  b.fillStyle = v; b.fillRect(0, 0, W, H);

  // A small "photograph" inside a frame of film: a horizon, a sun, a block, in tones of the film (a negative) or of the table.
  const picture = (g, x, y, w, h, r, neg) => {
    const c = (k) => (neg ? mix(P.film, P.light, k) : mix(P.light, P.ink, k));
    g.fillStyle = c(0.18); g.fillRect(x, y, w, h);
    g.fillStyle = c(0.42); g.fillRect(x, y + h * (0.5 + r() * 0.2), w, h);
    g.fillStyle = c(0.62); g.beginPath(); g.arc(x + w * (0.2 + r() * 0.6), y + h * (0.25 + r() * 0.15), h * 0.13, 0, Math.PI * 2); g.fill();
    g.fillStyle = c(0.3); const bw = w * (0.15 + r() * 0.2); g.fillRect(x + w * r() * 0.7, y + h * 0.35, bw, h * 0.4);
  };
  const pad = 40, [decor, g] = mk(W + pad * 2, H + pad * 2), r = rng(4471);
  g.translate(pad, pad);
  // the negatives across the top
  g.save(); g.translate(W / 2, 118); g.rotate(rtl ? -0.05 : 0.05);
  film(g, -W * 0.62, -66, W * 1.24, 132, P, false, 0.1);
  for (let i = 0; i < 6; i++) picture(g, -W * 0.62 + 30 + i * 230, -66 + 44, 196, 44, r, true);
  g.restore();
  // two slide mounts and a rule at the foot
  const mount = (x, y, s, a) => {
    g.save(); g.translate(x, y); g.rotate(a); shade(g, 0.05); g.fillStyle = P.card; g.fillRect(-s / 2, -s / 2, s, s); noShade(g);
    g.strokeStyle = P.edge; g.lineWidth = 1.5; g.strokeRect(-s / 2, -s / 2, s, s);
    const w = s * 0.62, h = s * 0.44; picture(g, -w / 2, -h / 2, w, h, r, r() < 0.5); g.restore();
  };
  mount(rtl ? W - 190 : 190, 1520, 230, 0.12);
  mount(rtl ? 330 : W - 330, 1610, 250, -0.09);
  g.save(); g.translate(W / 2, 1810); g.rotate(-0.025); shade(g, 0.05); g.fillStyle = P.card; g.fillRect(-W * 0.6, -34, W * 1.2, 68); noShade(g);
  g.fillStyle = P.edge;
  for (let k = 0, x = -W * 0.6 + 20; x < W * 0.6; k++, x += 12) g.fillRect(x, -34, 2, k % 10 === 0 ? 30 : k % 5 === 0 ? 20 : 11);
  g.restore();

  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      const lx = W / 2 + Math.sin(time * 0.21) * 170, ly = 780 + Math.cos(time * 0.16) * 140;   // the light underneath, wandering
      const l = ctx.createRadialGradient(lx, ly, 40, lx, ly, 880);
      l.addColorStop(0, rgba('#ffffff', T.tone.glow)); l.addColorStop(1, rgba('#ffffff', 0));
      ctx.fillStyle = l; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(decor, -pad + Math.sin(time * 0.33) * 9, -pad + Math.cos(time * 0.27) * 6);
    },
  };
}
