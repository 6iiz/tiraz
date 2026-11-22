// The glow-dots joint: the next scene opens through out-of-focus discs of light. Soft round apertures appear one after another at
// seeded places, swell and merge until the new night has replaced the old one; each opening's edge carries a faint warm rim, as a
// bokeh disc does. Both scenes are the same dark night, so nothing flashes.
import { rgba, rng } from '/engine/kit.js';
import { palette, S } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), r = rng(77), holes = [];
  for (let i = 0; i < 46; i++) holes.push({ x: r() * W, y: r() * H, d: r() * 0.45, R: 260 + r() * 260 });
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath();
      const open = [];
      for (const h of holes) { const q = S((p - h.d) / 0.55); if (q <= 0) continue; const rr = h.R * q; ctx.moveTo(h.x + rr, h.y); ctx.arc(h.x, h.y, rr, 0, Math.PI * 2); open.push([h, rr, q]); }
      ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [h, rr, q] of open) { ctx.strokeStyle = rgba(pal.warm, 0.1 * (1 - q)); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(h.x, h.y, rr, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      const last = S((p - 0.8) / 0.2);                      // the last gaps between the discs close softly
      if (last > 0) { ctx.save(); ctx.globalAlpha = last; ctx.drawImage(to, 0, 0); ctx.restore(); }
    },
  };
}
