// The Rapid Play joint, a star iris: a spiky star opens from the middle of the frame, turning as it grows, with a thick dark rim;
// the next game is inside it. It runs on ones, fast, like the cut between two microgames.
import { palette } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), R = Math.hypot(W, H) * 0.75, cx = W / 2, cy = 740;
  const path = (c, r, a) => { for (let i = 0; i < 20; i++) { const ang = a + (i * Math.PI) / 10, rr = i % 2 ? r * 0.72 : r;
    i ? c.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr) : c.moveTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr); } c.closePath(); };
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      if (p <= 0) return;
      const q = p < 1 ? 1 - (1 - p) ** 2 : 1, r = R * 1.4 * q, a = p * 2.2;
      ctx.save(); ctx.beginPath(); path(ctx, r, a); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p < 1) { ctx.save(); ctx.beginPath(); path(ctx, r, a); ctx.lineWidth = 22; ctx.lineJoin = 'round'; ctx.strokeStyle = P.d; ctx.stroke(); ctx.restore(); }
    },
  };
}
