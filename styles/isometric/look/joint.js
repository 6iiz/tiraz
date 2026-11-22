// The isometric joint: the next scene rises from below behind an edge set at the lattice's own 30 degrees, with a thin rule along it.
import { mix, ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const k = Math.tan(Math.PI / 6), rule = mix(brand.colors.bg, brand.colors.text, 0.4);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p);
      if (q <= 0) return;
      const c = (H + W * k) * (1 - q) - W * k * q;            // the edge runs from (0, c + W k) up to (W, c)
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, c + W * k); ctx.lineTo(W, c); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
      ctx.drawImage(to, 0, 0); ctx.restore();
      if (q < 1) { ctx.strokeStyle = rule; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, c + W * k); ctx.lineTo(W, c); ctx.stroke(); }
    },
  };
}
