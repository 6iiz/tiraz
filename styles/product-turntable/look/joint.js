// The product-turntable joint: a fresh length of backdrop paper is pulled down from its roll. The roll's edge travels from the top
// of the frame to the bottom; above it the next set is already lit, below it the old one is still there, and the roll itself is a
// shaded band of the studio paper with a soft shadow under it. Tonal: the paper is the studio's own colour, so nothing flashes.
import { mix, rgba } from '/engine/kit.js';
import { tones } from './ground.js';

export function create({ W, H, brand, look }) {
  const tn = tones(brand, look.tokens), R = 64;
  const roll = document.createElement('canvas'); roll.width = 8; roll.height = R;
  const g = roll.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, R);
  gr.addColorStop(0, mix(tn.hi, tn.ink, 0.25)); gr.addColorStop(0.35, mix(tn.hi, tn.paper, 0.18)); gr.addColorStop(0.7, tn.hi); gr.addColorStop(1, mix(tn.lo, tn.ink, 0.35));
  g.fillStyle = gr; g.fillRect(0, 0, 8, R);
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  return {
    draw(ctx, from, to, p) {
      const y = Math.round(-R + (H + R * 2) * ease(Math.min(1, Math.max(0, p))));
      ctx.drawImage(from, 0, 0);
      if (y > 0) ctx.drawImage(to, 0, 0, W, Math.min(H, y), 0, 0, W, Math.min(H, y));
      const sh = ctx.createLinearGradient(0, y + R, 0, y + R + 70);
      sh.addColorStop(0, rgba(tn.ink, tn.dark ? 0.55 : 0.3)); sh.addColorStop(1, rgba(tn.ink, 0));
      ctx.fillStyle = sh; ctx.fillRect(0, y + R, W, 70);
      ctx.drawImage(roll, 0, 0, 8, R, 0, y, W, R);
    },
  };
}
