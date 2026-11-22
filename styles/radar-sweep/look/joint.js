// The Radar Sweep joint: one fast turn of the arm. The next scene is revealed in the sector the arm has already swept, clockwise from
// straight up around the scope's centre, with a bright arm on the edge; the old scene stays in the part not yet swept.
import { rgba, contrast } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const cx = W / 2, cy = look.tokens.scope.cy, R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 10;
  const { bg, text } = brand.colors, light = contrast(bg, '#000000') > contrast(text, '#000000') ? bg : text;
  const e = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const a0 = -Math.PI / 2, a = a0 + e(p) * Math.PI * 2;
      if (p <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a); ctx.closePath(); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (p < 1) { ctx.save(); ctx.strokeStyle = rgba(light, 0.85); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); ctx.restore(); }
    },
  };
}
