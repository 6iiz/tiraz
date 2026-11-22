// The keynote joint: the light sweep, frame wide. A soft slanted edge crosses the stage from the reading side; behind it is the next
// scene, and along it runs a faint band of light. Both scenes are dark stages, so nothing flashes.
import { rgba } from '/engine/kit.js';
import { palette, S } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', soft = 70, glow = 260, slope = 0.25;
  const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
  const b = buf.getContext('2d');
  const n = Math.hypot(1, slope), ux = (rtl ? -1 : 1) / n, uy = slope / n;     // points from the uncovered side to the covered one
  const travel = W + 2 * glow + slope * H;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const e = S(p), c = rtl ? W + glow + slope * H / 2 - travel * e : -glow - slope * H / 2 + travel * e, cy = H / 2;
      const ax = c - ux * soft, ay = cy - uy * soft, bx = c + ux * soft, by = cy + uy * soft;
      b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); b.drawImage(to, 0, 0);
      b.globalCompositeOperation = 'destination-in';
      const g = b.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, rgba(pal.light, 1)); g.addColorStop(1, rgba(pal.light, 0));
      b.fillStyle = g; b.fillRect(0, 0, W, H);
      ctx.drawImage(buf, 0, 0);
      const band = ctx.createLinearGradient(c - ux * glow, cy - uy * glow, c + ux * glow, cy + uy * glow), a = 0.08 * Math.sin(Math.PI * p);
      band.addColorStop(0, rgba(pal.light, 0)); band.addColorStop(0.5, rgba(pal.light, a)); band.addColorStop(1, rgba(pal.light, 0));
      ctx.fillStyle = band; ctx.fillRect(0, 0, W, H);
    },
  };
}
