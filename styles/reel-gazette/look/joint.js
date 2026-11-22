// The gazette joint: an iris. The next story opens in a growing circle from the middle of the gate, its edge softened by a dark ring,
// on the projector's frames. The old story is never blacked out: the circle opens over it.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const fps = look.tokens.fps ?? 24, cx = W / 2, cy = H * 0.42, R = Math.hypot(W, H) * 0.62;
  const lum = (h) => [1, 3, 5].reduce((s, i, k) => s + [0.2126, 0.7152, 0.0722][k] * parseInt(h.slice(i, i + 2), 16), 0);
  const dark = lum(brand.colors.bg) <= lum(brand.colors.text) ? brand.colors.bg : brand.colors.text;
  return {
    draw(ctx, from, to, p, info) {
      const steps = Math.max(2, Math.round(0.5 * fps)), pq = Math.floor(p * steps) / steps;
      ctx.drawImage(from, 0, 0);
      const r = R * ease.inOutQuad(pq);
      if (r <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      if (pq < 1) { ctx.strokeStyle = dark; ctx.globalAlpha = 0.8; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(cx, cy, r + 9, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    },
  };
}
