// The isometric ground: the brand's background with a faint 30-degree lattice that is strongest near the floor (the bottom) and fades
// toward the sky. It drifts one lattice cell every ten seconds, so a held line still breathes. Built once; uses `clock`.
import { mix, rgba, span } from '/engine/kit.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, { bg, text } = brand.colors, u = T.unit, step = u * 2, k = Math.tan(Math.PI / 6);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H + step;
  const g = cv.getContext('2d');
  g.strokeStyle = mix(bg, text, T.tone.grid); g.lineWidth = 1.5;
  for (let c = -W * k - step; c < cv.height + W * k + step; c += step) {
    g.beginPath(); g.moveTo(0, c); g.lineTo(W, c + W * k); g.stroke();
    g.beginPath(); g.moveTo(0, c); g.lineTo(W, c - W * k); g.stroke();
  }
  g.globalCompositeOperation = 'destination-in';
  const fade = g.createLinearGradient(0, 0, 0, cv.height);
  fade.addColorStop(0, rgba(text, 0.12)); fade.addColorStop(0.45, rgba(text, 0.45)); fade.addColorStop(1, rgba(text, 1));
  g.fillStyle = fade; g.fillRect(0, 0, W, cv.height);
  return {
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const dy = ((time * step / 10) % step + step) % step;    // the lattice repeats every `step` px vertically, so the drift never jumps
      ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * span(time, -0.8, 0.6);
      ctx.drawImage(cv, 0, dy - step);
      ctx.restore();
    },
  };
}
