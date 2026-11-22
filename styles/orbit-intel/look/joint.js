// The orbit-intel joint: re-tasking. The next view opens inside a hairline frame that grows from the centre of the old one to the
// full frame, its corners ticked like the plates. Picture replaces picture; nothing flashes.
import { palette, snap } from './motion.js';
export function create({ W, H, brand }) {
  const pal = palette(brand);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const e = snap(p * 1.05), w = W * (0.12 + 0.88 * e), h = H * (0.12 + 0.88 * e), x = (W - w) / 2, y = (H - h) / 2;
      if (p <= 0) return;
      ctx.drawImage(to, x, y, w, h, x, y, w, h);
      if (e >= 1) return;
      ctx.strokeStyle = pal.light; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = pal.key; const L = 28;
      for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]]) { ctx.fillRect(cx, cy - (sy < 0 ? 4 : 0), L * sx, 4); ctx.fillRect(cx - (sx < 0 ? 4 : 0), cy, 4, L * sy); }
    },
  };
}
