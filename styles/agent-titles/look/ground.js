// The agent-titles ground: one flat ink per location (each part picks which of the four inks is its ground), a few background props cut
// from a darker (or lighter) step of that ink (tall pillars and one giant circle), and the paper texture on top. The props drift
// sideways on ones, as if the camera tracked past them; they never carry text and are only a step of tone away from the ground.
import { inks, cut, rect, ring, paperTexture } from './motion.js';

export function create({ W, H, brand, look, clock = 0, which = 'paper', seed = 3 }) {
  const I = inks(brand), rtl = brand.dir !== 'ltr';
  const g = which === 'hot' ? I.hot : which === 'ink' ? I.ink : which === 'second' ? I.second : I.paper;
  const shade = I.shade(g), tex = paperTexture(W, H, I);
  const props = [
    cut(rect(-120 + seed * 37 % 140, 380, 120, 1700), seed, 2.2),
    cut(rect(640 + seed * 53 % 160, 920, 96, 1200), seed + 1, 2.2),
    cut(rect(880 + seed * 23 % 90, 160, 150, 640), seed + 2, 2.2),
    cut(ring(rtl ? 200 : W - 200, 520, 330, 96), seed + 3, 2.6),
  ];
  return {
    I, color: g, ink: I.on(g),
    draw(ctx, t) {
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const drift = ((t + clock) * 14) % 400;
      ctx.save(); ctx.translate(rtl ? drift - 200 : 200 - drift, 0); ctx.fillStyle = shade; for (const p of props) ctx.fill(p); ctx.restore();
      ctx.drawImage(tex, 0, 0);
    },
  };
}
