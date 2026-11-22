// The point-cloud joint: a re-scan. A scan front runs down the frame; above it the next scene has been captured, below it the last
// one still stands. The front is a hairline in the class colour with three rows of returns trailing it. No flash, no fade.
import { rgba } from '/engine/kit.js';
import { palette, outC } from './motion.js';
export function create({ W, H, brand }) {
  const pal = palette(brand);
  return {
    draw(ctx, from, to, p) {
      const e = outC(p) * 0.82 + p * 0.18, y = (H + 60) * e - 30;
      ctx.drawImage(from, 0, 0);
      if (y > 0) ctx.drawImage(to, 0, 0, W, Math.min(H, y), 0, 0, W, Math.min(H, y));
      if (p <= 0 || p >= 1) return;
      ctx.fillStyle = rgba(pal.dark, 0.55); ctx.fillRect(0, y, W, 40);
      for (let row = 0; row < 3; row++) {
        ctx.fillStyle = rgba(pal.key, 0.75 - row * 0.22);
        for (let x = (row * 5) % 12; x < W; x += 12) ctx.fillRect(x, y + 8 + row * 10, 3, 3);
      }
      ctx.fillStyle = pal.key; ctx.fillRect(0, y - 1, W, 2);
    },
  };
}
