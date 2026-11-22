// The poster ground: the brand's background, a printed grain, and a sunburst of faint rays radiating from below the lower corner on the
// reading side's far end, turning very slowly through the whole reel. The rays are a step of tone only, so text on the ground stays
// readable over them. Grain and rays are built once; the turn uses `clock`.
import { mix, rgba, rng } from '/engine/kit.js';
import { rad } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, { bg, text } = brand.colors, rtl = brand.dir !== 'ltr';
  const R = Math.hypot(W, H) * 1.3, n = T.rays;
  const cx = rtl ? -160 : W + 160, cy = H + 220;
  const ray = mix(bg, text, T.tone.ray);
  const grain = document.createElement('canvas'); grain.width = W; grain.height = H;
  const gg = grain.getContext('2d'), r = rng(1917);
  for (let i = 0; i < 26000; i++) {
    gg.fillStyle = rgba(r() < 0.5 ? bg : text, T.tone.grain * (0.4 + r()));
    gg.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  return {
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const turn = time * 1.2 * (rtl ? 1 : -1);
      ctx.fillStyle = ray; ctx.beginPath();
      for (let i = 0; i < n; i += 2) { const a0 = rad((i / n) * 360 + turn), a1 = rad(((i + 1) / n) * 360 + turn); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); }
      ctx.fill();
      ctx.drawImage(grain, 0, 0);
    },
  };
}
