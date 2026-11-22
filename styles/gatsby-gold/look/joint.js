// The Gatsby joint: the old frame parts like a pair of lacquer doors along the axis, each half sliding out to its side with an engraved
// gold edge on its seam, and the next scene stands behind them. Both scenes share the same dark lacquer, so the cut never flashes.
import { ease, clamp } from '/engine/kit.js';
import { palette, gline, metal } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), half = W / 2;
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(clamp(p)), off = q * (half + 20);
      ctx.drawImage(to, 0, 0);
      if (off >= half + 19) return;
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(half - off - 30, 0, 30, H); ctx.fillRect(half + off, 0, 30, H); ctx.restore();   // the doors' shadow
      ctx.drawImage(from, 0, 0, half, H, -off, 0, half, H);
      ctx.drawImage(from, half, 0, half, H, half + off, 0, half, H);
      const paint = metal(ctx, 0, 0, 0, H, pal, 1 - q * 1.4);
      gline(ctx, (c) => { c.beginPath(); c.moveTo(half - off - 2, 0); c.lineTo(half - off - 2, H); c.moveTo(half + off + 2, 0); c.lineTo(half + off + 2, H); }, 3, pal, paint);
    },
  };
}
