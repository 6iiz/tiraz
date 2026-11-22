// The Ink Cutaway joint: a cutting-plane line crosses the sheet from top to bottom. It is drawn the drafting way, a long-dash, short-
// dash chain with heavy ends and two arrows that show the direction of view; above it the next sheet is already there, below it the
// old one still is. Paper replaces paper, so the frame's brightness hardly moves.
import { E, palette, arrowHead } from './motion.js';
export function create({ W, H, brand }) {
  const pal = palette(brand);
  return {
    draw(ctx, from, to, p) {
      const y = -40 + (H + 80) * E(p);
      ctx.drawImage(from, 0, 0);
      if (y > 0) ctx.drawImage(to, 0, 0, W, Math.min(H, y), 0, 0, W, Math.min(H, y));
      ctx.save(); ctx.strokeStyle = pal.ink; ctx.lineWidth = 2; ctx.setLineDash([46, 9, 6, 9]); ctx.lineDashOffset = -p * 200;
      ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(80, y); ctx.moveTo(W - 80, y); ctx.lineTo(W - 30, y); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(55, y); ctx.lineTo(55, y + 46); ctx.moveTo(W - 55, y); ctx.lineTo(W - 55, y + 46); ctx.stroke();
      arrowHead(ctx, 55, y + 62, Math.PI / 2, 20, pal.ink); arrowHead(ctx, W - 55, y + 62, Math.PI / 2, 20, pal.ink);
      ctx.restore();
    },
  };
}
