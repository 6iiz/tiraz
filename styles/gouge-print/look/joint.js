// The gouge-print joint: the sheet is pulled off the block. The next print is already on the paper; the fold travels down the frame,
// above it the new print, below it the inked block still; just under the fold the lifted paper curls over, showing the print the wrong
// way round, mirrored, as a pulled proof does. The curl is shaded with the block's own ink, so the frame's brightness hardly moves.
import { ease } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens);
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), F = 150 * Math.sin(Math.PI * q), y = -F + (H + 2 * F) * q;
      ctx.drawImage(from, 0, 0);
      if (y > 0) ctx.drawImage(to, 0, 0, W, Math.min(H, y), 0, 0, W, Math.min(H, y));
      if (F > 1 && y > -F && y < H + F) {
        // the curl: the strip of the new print just above the fold, mirrored below it
        ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, F); ctx.clip();
        ctx.translate(0, 2 * y); ctx.scale(1, -1); ctx.drawImage(to, 0, 0);
        ctx.restore();
        const g = ctx.createLinearGradient(0, y, 0, y + F);
        g.addColorStop(0, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = g; ctx.fillRect(0, y, W, F);
        ctx.fillStyle = P.flap; ctx.fillRect(0, y + F - 3, W, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y + F, W, 10);
      }
    },
  };
}
