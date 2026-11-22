// The Projected Maquette joint: a slide change. The next layer opens from the middle of the table as a widening aperture of projected
// light with a soft bright rim, over the layer before it. Tonal: the rim is thin and dim, the frame never floods.
import { rgba } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), cx = W / 2, cy = look.tokens.cam.y - 200;
  const ease = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.05;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const e = ease(p), rw = R * e, rh = R * e, rad = Math.min(rw, rh) * 0.25;
      if (e <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.roundRect(cx - rw, cy - rh, rw * 2, rh * 2, rad); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (e < 1) {
        ctx.save(); ctx.strokeStyle = rgba(pal.beam, 0.35 * (1 - e)); ctx.lineWidth = 6; ctx.shadowColor = rgba(pal.beam, 0.6); ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.roundRect(cx - rw, cy - rh, rw * 2, rh * 2, rad); ctx.stroke(); ctx.restore();
      }
    },
  };
}
