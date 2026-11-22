// The gas-glow joint: a reflection crosses the window. A slanted edge slides across the glass from the reading side, and behind it
// the window already shows the next sign; a faint blurred band of street light rides the edge. Tonal and soft: the band is a few
// percent of light, so the frame never flashes.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p); if (q <= 0) return;
      const slant = 420, x = -slant + (W + slant * 2) * q, edge = rtl ? W - x : x;
      ctx.save(); ctx.beginPath();
      if (rtl) { ctx.moveTo(W + slant, 0); ctx.lineTo(edge, 0); ctx.lineTo(edge + slant, H); ctx.lineTo(W + slant, H); }
      else { ctx.moveTo(-slant, 0); ctx.lineTo(edge, 0); ctx.lineTo(edge - slant, H); ctx.lineTo(-slant, H); }
      ctx.closePath(); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (q < 1) {
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.06 * Math.sin(q * Math.PI);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 90; ctx.filter = 'blur(30px)';
        ctx.beginPath(); ctx.moveTo(edge, 0); ctx.lineTo(rtl ? edge + slant : edge - slant, H); ctx.stroke(); ctx.restore();
      }
    },
  };
}
