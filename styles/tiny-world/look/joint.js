// The tiny-world joint: the camera tilts to another corner of the model. The old frame slides up and falls out of focus, the next one
// comes up from below out of focus and sharpens into its band, like a focus pull on a long lens. No flash: both frames keep their tone.
import { ease, clamp } from '/engine/kit.js';
export function create({ W, H }) {
  const lo = document.createElement('canvas'); lo.width = Math.ceil(W / 5); lo.height = Math.ceil(H / 5); const lg = lo.getContext('2d');
  const soft = (ctx, src, b, y, a = 1) => {
    ctx.save(); ctx.globalAlpha = a;
    if (b > 0.02) { lg.filter = `blur(${(b * 4).toFixed(2)}px)`; lg.clearRect(0, 0, lo.width, lo.height); lg.drawImage(src, 0, 0, lo.width, lo.height); lg.filter = 'none'; ctx.drawImage(lo, 0, y, W, H); }
    if (b < 0.35) { ctx.globalAlpha = a * (1 - b / 0.35); ctx.drawImage(src, 0, y); }
    ctx.restore();
  };
  return {
    draw(ctx, from, to, p) {
      const e = ease.inOutCubic(p), shift = H * 0.22;
      soft(ctx, from, clamp(p * 2.2), -e * shift);
      soft(ctx, to, clamp((1 - p) * 2.2), (1 - e) * shift, ease.inOutQuad(clamp((p - 0.25) / 0.45)));
    },
  };
}
