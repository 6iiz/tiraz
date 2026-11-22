// The assembly-guide ground: a sheet of printed stock (the lighter brand colour) with faint fibres, a thin page rule at the top and
// the bottom like a manual's page, and nothing else. Built once.
import { rng, rgba } from '/engine/kit.js';
import { inks } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, K = inks(brand, T);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(3911);
  g.fillStyle = K.paper; g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  for (let i = 0; i < 420; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 6 + r() * 18;
    g.strokeStyle = rgba(K.ink, 0.03 + r() * 0.03); g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.fillStyle = K.rule; g.fillRect(48, 222, W - 96, 2); g.fillRect(48, H - 150, W - 96, 2);
  return { K, draw(ctx) { ctx.drawImage(cv, 0, 0); } };
}
