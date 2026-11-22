// The evidence-table joint: the next scene arrives as a fresh sheet of the table slid in from the reading side over the last one,
// its leading edge casting a soft shadow on what it covers. A tonal move: table over table, never a flash.
import { ease, rgba } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p), edge = rtl ? W * (1 - q) : W * q;
      const g = ctx.createLinearGradient(edge, 0, edge + (rtl ? -60 : 60), 0);
      g.addColorStop(0, rgba('#000000', 0.18 * Math.min(1, (1 - q) * 4))); g.addColorStop(1, rgba('#000000', 0));
      ctx.fillStyle = g; ctx.fillRect(rtl ? edge - 60 : edge, 0, 60, H);
      ctx.save(); ctx.beginPath(); rtl ? ctx.rect(edge, 0, W - edge, H) : ctx.rect(0, 0, edge, H); ctx.clip();
      ctx.drawImage(to, rtl ? edge : edge - W, 0); ctx.restore();
    },
  };
}
