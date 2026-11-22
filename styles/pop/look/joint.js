// The pop joint: a Ben-Day dissolve. The next scene shows through a screen of dots that swell from pinpoints until they merge and
// cover the frame; the dots start in the middle and spread outward, so the change reads as a print, not a fade.
import { ease } from '/engine/kit.js';

export function create({ W, H, brand, look }) {
  const c = 64, rows = [], R = Math.hypot(W / 2, H / 2);
  for (let j = 0, y = 0; y < H + c; j++, y += c * 0.866)
    for (let x = (j % 2) * c / 2; x < W + c; x += c) rows.push([x, y, Math.hypot(x - W / 2, y - H / 2) / R]);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      if (p <= 0) return;
      if (p >= 1) { ctx.drawImage(to, 0, 0); return; }
      ctx.save(); ctx.beginPath();
      for (const [x, y, f] of rows) {
        const r = c * 0.66 * ease.inOutQuad((p * 1.5 - f * 0.5));
        if (r > 0.5) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
      }
      ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
    },
  };
}
