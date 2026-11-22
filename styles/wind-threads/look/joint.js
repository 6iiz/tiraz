// The wind-threads joint: the next chart is blown in. Its edge is a wavering front that crosses the frame with the wind, from the
// reading side, and along the front runs a band of short dark strokes, as if the gust were visible for a moment. Paper replaces paper.
import { rgba, rng } from '/engine/kit.js';
import { palette, S } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', r = rng(91), streaks = [];
  for (let i = 0; i < 70; i++) streaks.push({ y: r() * H, l: 40 + r() * 120, o: r() * 90 });
  const front = (y, p) => { const base = -160 + (W + 320) * S(p); const x = base + 60 * Math.sin(y / 210 + p * 3) + 30 * Math.sin(y / 77); return rtl ? W - x : x; };
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.moveTo(rtl ? W : 0, 0);
      for (let y = 0; y <= H; y += 24) ctx.lineTo(front(y, p), y);
      ctx.lineTo(rtl ? W : 0, H); ctx.closePath(); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p > 0 && p < 1) {
        ctx.save(); ctx.strokeStyle = rgba(pal.ink, 0.35 * Math.sin(Math.PI * p)); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
        for (const s of streaks) { const x = front(s.y, p) + (rtl ? 1 : -1) * s.o; ctx.moveTo(x, s.y); ctx.lineTo(x + (rtl ? 1 : -1) * s.l, s.y + 4); }
        ctx.stroke(); ctx.restore();
      }
    },
  };
}
