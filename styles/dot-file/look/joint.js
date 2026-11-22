// The dot-file joint: a halftone dissolve. The next page shows through a screen of dots that swell from a diagonal front across the
// frame until they merge into solid, the way a tint becomes ink. Paper over paper, so it never flashes.
import { clamp } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const step = 54, rtl = brand.dir !== 'ltr', a = (20 * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), pts = [];
  for (let u = -H; u < W + H; u += step) for (let v = -H; v < W + H; v += step) {
    const x = u * ca - v * sa, y = u * sa + v * ca;
    if (x < -step || y < -step || x > W + step || y > H + step) continue;
    pts.push([x, y, ((rtl ? W - x : x) / W) * 0.45 + (y / H) * 0.55]);          // when the front reaches it, 0..1
  }
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath();
      for (const [x, y, f] of pts) { const r = clamp((p * 1.7 - f * 0.7) * 2) * step * 0.75; if (r > 0.5) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); } }
      ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
    },
  };
}
