// The liquid-pour joint: a curtain of the key liquid pours down over the frame. Its leading edge is uneven and drips run ahead of
// it; it covers the old scene from the top, and its trailing edge, falling after it, uncovers the new one. Glossy streaks run down
// the sheet. Computed from p only.
import { mix, rgba } from '/engine/kit.js';
import { palette } from './ground.js';
import { hash } from './motion.js';

export function create({ W, H, brand }) {
  const P = palette(brand);
  // the sheet, painted once: the key liquid, darker at its sides, with vertical gloss streaks
  const sheet = document.createElement('canvas'); sheet.width = W; sheet.height = 8;
  { const g = sheet.getContext('2d'), gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, mix(P.key, P.night, 0.45)); gr.addColorStop(0.3, P.key); gr.addColorStop(0.7, mix(P.key, P.night, 0.15)); gr.addColorStop(1, mix(P.key, P.night, 0.5));
    g.fillStyle = gr; g.fillRect(0, 0, W, 8);
    for (let i = 0; i < 14; i++) { const x = hash(i, 3) * W, w = 6 + hash(i, 7) * 40; g.fillStyle = rgba('#ffffff', 0.05 + hash(i, 9) * 0.16); g.fillRect(x, 0, w, 8); } }
  const drips = Array.from({ length: 9 }, (_, i) => ({ x: (i + 0.2 + hash(i, 1) * 0.6) / 9 * W, w: 14 + hash(i, 2) * 16, l: 60 + hash(i, 4) * 170 }));
  const N = 160;
  const edge = (ctx, yBase, p, lead) => {
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(W, -10);
    for (let i = N; i >= 0; i--) {
      const x = i / N * W;
      let y = yBase + 26 * Math.sin(x * 0.011 + p * 5 + (lead ? 0 : 2)) + 14 * Math.sin(x * 0.029 - p * 7);
      if (lead) for (const d of drips) { const u = (x - d.x) / d.w; if (Math.abs(u) < 1) y += d.l * Math.pow(1 - u * u, 0.3) * Math.min(1, p * 2.2); }
      ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  const ease = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p));
  return {
    draw(ctx, from, to, p) {
      const yLead = -260 + (H + 520) * ease(Math.min(1, p / 0.62));
      const yTrail = -320 + (H + 620) * ease(Math.max(0, (p - 0.34) / 0.66));
      ctx.drawImage(from, 0, 0);
      ctx.save(); edge(ctx, yLead, p, true); ctx.clip(); ctx.drawImage(sheet, 0, 0, W, H);
      ctx.restore();
      ctx.save(); edge(ctx, yLead, p, true); ctx.strokeStyle = rgba('#ffffff', 0.22); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      if (yTrail > -300) { ctx.save(); edge(ctx, yTrail, p, false); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore(); }
    },
  };
}
