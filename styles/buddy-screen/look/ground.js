// The buddy-screen ground: a desktop wallpaper behind the floating window, made from the brand's colours. A deep gradient from the dark
// colour into a little of the accent, and two large soft blooms (one of the accent, one of the light colour) that drift very slowly with
// the reel's clock. Built once; drawn as two images.
import { rgba, mix } from '/engine/kit.js';
import { tones } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = tones(brand, look.tokens);
  const base = document.createElement('canvas'); base.width = W; base.height = H; const g = base.getContext('2d');
  const lg = g.createLinearGradient(0, 0, W * 0.4, H); lg.addColorStop(0, P.wallA); lg.addColorStop(1, P.wallB);
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  const bloom = document.createElement('canvas'); bloom.width = W + 600; bloom.height = H + 600; const b = bloom.getContext('2d');
  const blob = (x, y, r, c, a) => { const rg = b.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(c, a)); rg.addColorStop(1, rgba(c, 0)); b.fillStyle = rg; b.fillRect(0, 0, W + 600, H + 600); };
  blob(300 + W * 0.85, 300 + H * 0.12, 760, P.accent, 0.42);
  blob(300 + W * 0.1, 300 + H * 0.82, 820, mix(P.accent, P.light, 0.4), 0.22);
  blob(300 + W * 0.2, 300 + H * 0.3, 520, P.light, 0.07);
  return {
    pal: P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      ctx.drawImage(bloom, -300 + Math.sin(time * 0.13) * 60, -300 + Math.cos(time * 0.1) * 80);
    },
  };
}
