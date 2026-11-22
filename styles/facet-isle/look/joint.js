// The facet-isle joint: the next scene opens through a honeycomb. Hexagonal cells grow from the island at the bottom of the frame
// upwards, each a little after the one below it and each growing with the bounce, until they close into the new frame.
import { B } from './motion.js';
export function create({ W, H }) {
  const r = 62, dx = Math.sqrt(3) * r, dy = 1.5 * r, cells = [];
  for (let j = -1; j * dy < H + r * 2; j++) for (let i = -1; i * dx < W + dx; i++) {
    const x = i * dx + (j % 2 ? dx / 2 : 0), y = j * dy;
    const dist = Math.hypot((x - W / 2) * 0.8, H * 0.85 - y) / Math.hypot(W, H);
    cells.push({ x, y, delay: dist * 0.55 + ((i * 7 + j * 13) % 5) * 0.012 });
  }
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath();
      for (const c of cells) {
        const q = (p - c.delay) / 0.4; if (q <= 0) continue;
        const s = q >= 1 ? 1.04 : B(q) * 1.04;
        for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3, x = c.x + Math.cos(a) * r * s, y = c.y + Math.sin(a) * r * s; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath();
      }
      ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
    },
  };
}
