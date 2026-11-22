// The slide-lens joint, a change of objective: the iris diaphragm closes part way over the field while the old view is pushed in
// (more magnification), the turret turns, and the iris opens again on the new view, which settles from a little too close.
// The blades are lit from below, a mid tone between bench and glass, so the frame keeps its brightness: nothing flashes.
import { mix } from '/engine/kit.js';
import { palette, S } from './motion.js';
export function create({ W, H, brand, look }) {
  const T = look.tokens, L = T.lens, pal = palette(brand, T), blade = mix(pal.bench, pal.glass, 0.5);
  const iris = (ctx, r) => {
    ctx.save(); ctx.fillStyle = blade; ctx.beginPath(); ctx.arc(L.cx, L.cy, L.r + 2, 0, Math.PI * 2); ctx.arc(L.cx, L.cy, r, 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.strokeStyle = pal.rim; ctx.lineWidth = L.rim; ctx.beginPath(); ctx.arc(L.cx, L.cy, r + L.rim / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };
  const zoomed = (ctx, img, s) => { ctx.drawImage(img, 0, 0); ctx.save(); ctx.beginPath(); ctx.arc(L.cx, L.cy, L.r, 0, Math.PI * 2); ctx.clip(); ctx.translate(L.cx, L.cy); ctx.scale(s, s); ctx.translate(-L.cx, -L.cy); ctx.drawImage(img, 0, 0); ctx.restore(); };
  return {
    draw(ctx, from, to, p) {
      ctx.fillStyle = pal.bench; ctx.fillRect(0, 0, W, H);
      if (p < 0.5) { const q = S(p / 0.5); zoomed(ctx, from, 1 + 0.1 * q); iris(ctx, L.r * (1 - 0.42 * q)); }
      else { const q = S((1 - p) / 0.5); zoomed(ctx, to, 1 + 0.06 * q); if (q > 0.002) iris(ctx, L.r * (1 - 0.42 * q)); }
    },
  };
}
