// The data ground: the brand's background as a dark (or light) chart sheet. Faint horizontal gridlines every grid step draw themselves
// from the reading side in the reel's first second, with a short tick at each line's reading end; after that the sheet is still.
// Uses `clock`, so the grid draws once per reel and not at every scene.
import { mix, span } from '/engine/kit.js';
import { D } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, { bg, text } = brand.colors, step = T.grid.step, rtl = brand.dir !== 'ltr';
  const grid = mix(bg, text, T.tone.grid), tick = mix(bg, text, T.tone.grid * 2.2);
  const lines = []; for (let y = step; y < H; y += step) lines.push(y);
  return {
    step,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      lines.forEach((y, k) => {
        const p = D(span(time, -0.9 + k * 0.03, -0.1 + k * 0.03)); if (p <= 0) return;
        const len = W * p;
        ctx.fillStyle = grid; ctx.fillRect(rtl ? W - len : 0, y - 0.75, len, 1.5);
        ctx.fillStyle = tick; ctx.fillRect(rtl ? W - 36 : 18, y - 1, 18, 2);
      });
    },
  };
}
