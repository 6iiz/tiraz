// The wave-trace joint: the old picture cools away like phosphor while the beam draws one flat, fast trace across the screen from the
// reading side; the new picture comes up behind the trace. The frame only gets darker for a moment: nothing flashes.
import { rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), y = H * 0.4, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.fillStyle = pal.tube; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = Math.exp(-p * 7); ctx.drawImage(from, 0, 0); ctx.restore();
      ctx.save(); ctx.globalAlpha = Math.max(0, (p - 0.35) / 0.65) ** 1.5; ctx.drawImage(to, 0, 0); ctx.restore();
      const x = W * Math.min(1, p / 0.7), x0 = rtl ? W - x : 0, a = 1 - Math.max(0, (p - 0.7) / 0.3);
      ctx.fillStyle = rgba(pal.beam, 0.2 * a); ctx.fillRect(x0, y - 7, x, 14);
      ctx.fillStyle = rgba(pal.core, 0.9 * a); ctx.fillRect(x0, y - 1.5, x, 3);
    },
  };
}
