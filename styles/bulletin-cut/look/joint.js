// The bulletin joint, the sting: a slanted plate of the accent with a narrow ink plate on its heels crosses the frame from the reading
// side; behind them the next story is already on air. The plates cover a band of the frame, never the whole of it.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const rtl = brand.dir !== 'ltr', lean = 320, band = 200, tail = 46, gap = 14;
  const lum = (h) => [1, 3, 5].reduce((s, i, k) => s + [0.2126, 0.7152, 0.0722][k] * parseInt(h.slice(i, i + 2), 16), 0);
  const ink = lum(brand.colors.bg) <= lum(brand.colors.text) ? brand.colors.bg : brand.colors.text;
  // a slanted strip between edge positions e0 and e1 (measured along x at the top of the frame; the bottom is shifted by `lean`)
  const strip = (ctx, e0, e1) => {
    ctx.beginPath();
    if (rtl) { ctx.moveTo(W - e0, 0); ctx.lineTo(W - e1, 0); ctx.lineTo(W - e1 + lean, H); ctx.lineTo(W - e0 + lean, H); }
    else { ctx.moveTo(e0, 0); ctx.lineTo(e1, 0); ctx.lineTo(e1 - lean, H); ctx.lineTo(e0 - lean, H); }
    ctx.closePath();
  };
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const e = -lean + (W + lean * 2 + band + tail + gap) * ease.inOutCubic(p);     // the plate's leading edge
      ctx.save(); strip(ctx, -lean * 2, e - band - tail - gap); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.fillStyle = ink; strip(ctx, e - band - tail - gap, e - band - gap); ctx.fill();
      ctx.fillStyle = brand.colors.accent; strip(ctx, e - band, e); ctx.fill();
    },
  };
}
