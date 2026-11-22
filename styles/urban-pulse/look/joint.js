// The Urban Pulse joint: a rush of traffic. A front of horizontal light trails crosses the frame from the reading side, fast, and the
// next scene is already there behind it. Tonal: the trails are thin, so the frame never floods with light.
import { rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', r = rng(77);
  const lines = []; for (let i = 0; i < 26; i++) lines.push({ y: r() * H, lag: r() * 0.18, len: 160 + r() * 420, w: 2 + r() * 5, hot: r() < 0.3 });
  const ease = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  return {
    draw(ctx, from, to, p) {
      const e = ease(p), edge = rtl ? W * (1 - e) : W * e;
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath(); if (rtl) ctx.rect(edge, 0, W - edge, H); else ctx.rect(0, 0, edge, H); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p <= 0 || p >= 1) return;
      ctx.save();
      for (const l of lines) {
        const x = edge + (rtl ? -1 : 1) * l.lag * W * 0.6, tail = l.len;
        const g = ctx.createLinearGradient(x, 0, x + (rtl ? tail : -tail), 0);
        g.addColorStop(0, rgba(pal.light, 0.9)); g.addColorStop(0.3, rgba(l.hot ? pal.accent : pal.light, l.hot ? 0.75 : 0.35)); g.addColorStop(1, rgba(pal.accent, 0));
        ctx.fillStyle = g; ctx.fillRect(Math.min(x, x + (rtl ? tail : -tail)), l.y, tail, l.w);
      }
      ctx.restore();
    },
  };
}
