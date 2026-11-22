// The phosphor joint: the tube is switched off and on. The outgoing picture is squeezed toward a single bright line across the middle
// of the glass and the line shrinks to a dot of light; out of that line the next picture opens. The glass is dark on both sides, so the
// frame only gets darker for a moment: nothing flashes.
import { rgba } from '/engine/kit.js';
import { palette, E } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), mid = H * 0.45;
  return {
    draw(ctx, from, to, p) {
      ctx.fillStyle = pal.glass; ctx.fillRect(0, 0, W, H);
      const half = p < 0.5, q = half ? E(p / 0.5) : 1 - E((p - 0.5) / 0.5);      // 0 = full picture, 1 = a line
      const src = half ? from : to, h = Math.max(2, H * (1 - q) ** 2);
      ctx.save(); ctx.globalAlpha = 1 - q * 0.6; ctx.drawImage(src, 0, 0, W, H, 0, mid - h * (mid / H), W, h); ctx.restore();
      if (q > 0.5) {
        const w = W * (half ? 1 : 1 - (1 - q) * 0.2) * (0.3 + 0.7 * (1 - (q - 0.5) * 0.4)), a = (q - 0.5) * 2;
        ctx.fillStyle = rgba(pal.phos, 0.25 * a); ctx.fillRect((W - w) / 2, mid - 9, w, 18);
        ctx.fillStyle = rgba(pal.hot, 0.9 * a); ctx.fillRect((W - w) / 2, mid - 2, w, 4);
      }
    },
  };
}
