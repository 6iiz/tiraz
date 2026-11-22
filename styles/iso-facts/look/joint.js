// The iso-facts joint: the next sheet is laid down in isometric tiles. Diamond tiles of the lattice open from their centres, starting
// at the bottom of the board and running up the frame in a loose wave, until the new scene is whole. Both sheets are the same pale
// ground, so nothing flashes.
import { rng, clamp, ease } from '/engine/kit.js';
export function create({ W, H }) {
  const a = 66, b = a * Math.tan(Math.PI / 6), r = rng(77), tiles = [];
  for (let row = 0, y = -b; y < H + b; row++, y += b) for (let x = (row % 2 ? a : 0) - a; x < W + a; x += 2 * a)
    tiles.push({ x, y, k: (1 - y / H) * 0.62 + r() * 0.16 });
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      if (p <= 0) return;
      ctx.save(); ctx.beginPath();
      for (const t of tiles) {
        const q = ease.outCubic(clamp((p - t.k * 0.7) / 0.3)); if (q <= 0) continue;
        const qa = a * q * 1.02, qb = b * q * 1.02;
        ctx.moveTo(t.x, t.y - qb); ctx.lineTo(t.x + qa, t.y); ctx.lineTo(t.x, t.y + qb); ctx.lineTo(t.x - qa, t.y); ctx.closePath();
      }
      ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
    },
  };
}
