// The factory-flow joint: the roller shutter. Its slats run down over the last scene and roll straight back up over the next one,
// like a loading door between two bays. The shutter is a step of the wall's own tone, so the cut never flashes.
import { ease, mix } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), slat = 44, body = mix(P.night, P.light, 0.14), seam = mix(P.night, P.light, 0.05);
  return {
    draw(ctx, from, to, p) {
      const down = p < 0.5, q = down ? ease.inOutCubic(p * 2) : 1 - ease.inOutCubic((p - 0.5) * 2);
      ctx.drawImage(down ? from : to, 0, 0);
      const h = H * q; if (h <= 0) return;
      ctx.fillStyle = body; ctx.fillRect(0, 0, W, h);
      ctx.fillStyle = seam; for (let y = h - slat; y > -slat; y -= slat) ctx.fillRect(0, y, W, 6);
      ctx.fillStyle = P.line; ctx.fillRect(0, h - 18, W, 18);
      ctx.fillStyle = P.accent; ctx.fillRect(W / 2 - 60, h - 14, 120, 10);
    },
  };
}
