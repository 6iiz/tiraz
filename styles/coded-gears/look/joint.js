// The Coded Gears joint: the next scene opens inside a wheel. A gear-shaped window grows from the middle of the frame and turns as it
// grows, its rim ringed in the slate system's own line colour, until it is wider than the frame. Both scenes stand on the same plate.
import { gearPath, palette, smooth } from './motion.js';
export function create({ W, H, brand }) {
  const pal = palette(brand), G = gearPath(18, 10, { bore: 0, spokes: false }), R = Math.hypot(W, H) / 2 + 80;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = smooth(p), s = (R / G.r) * q;
      if (s <= 0.001) return;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(q * 1.4); ctx.scale(s, s);
      ctx.save(); ctx.clip(G.path, 'nonzero');
      ctx.scale(1 / s, 1 / s); ctx.rotate(-q * 1.4); ctx.translate(-W / 2, -H / 2); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.lineWidth = 6 / s; ctx.strokeStyle = pal.B.line; ctx.stroke(G.path);
      ctx.restore();
    },
  };
}
