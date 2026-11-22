// The lead-and-light joint: the next scene is glazed over the last one, quarry by quarry. Diamond pieces of the next frame are set in
// a run from the reading side on the stepped clock, each with its lead line, until the old frame is gone. No fade, no flash.
import { clamp, rng } from '/engine/kit.js';
import { palette, q } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), S = 150, rtl = brand.dir !== 'ltr', r = rng(919), cells = [];
  for (let j = -1; j * S / 2 < H + S; j++) for (let i = -1; i * S < W + S; i++) {
    const x = i * S + (j % 2 ? S / 2 : 0), y = j * S / 2, dx = rtl ? W - x : x;
    cells.push({ x, y, k: clamp((dx / W) * 0.6 + (y / H) * 0.25 + r() * 0.1) });
  }
  const path = (c, x, y) => { c.moveTo(x, y - S / 2); c.lineTo(x + S / 2, y); c.lineTo(x, y + S / 2); c.lineTo(x - S / 2, y); c.closePath(); };
  return {
    draw(ctx, from, to, p) {
      const pq = Math.floor(p * 18) / 18;                           // the stepped clock, in steps of the joint
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath();
      for (const c of cells) if (c.k < pq * 1.05) path(ctx, c.x, c.y);
      ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (pq > 0 && pq < 1) {                                       // lead round the freshly set pieces
        ctx.save(); ctx.strokeStyle = pal.lead; ctx.lineWidth = 5; ctx.beginPath();
        for (const c of cells) if (c.k < pq * 1.05 && c.k > pq * 1.05 - 0.1) path(ctx, c.x, c.y);
        ctx.stroke(); ctx.restore();
      }
    },
  };
}
