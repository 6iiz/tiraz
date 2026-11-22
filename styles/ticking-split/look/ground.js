// The ticking-split ground: the brand's darker colour, near black, with a fine grain built once, and a thin top rail on the reading side:
// a LIVE plate whose square light pulses once a second on the reel's clock. Cells and the clock are drawn by the parts over it.
import { rgba, rng } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), rtl = brand.dir !== 'ltr';
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = P.dark; g.fillRect(0, 0, W, H);
  const r = rng(424);
  for (let i = 0; i < 26000; i++) { g.fillStyle = rgba(P.light, 0.025 * (0.4 + r())); g.fillRect(r() * W, r() * H, 1.5, 1.5); }
  const A = T.area, live = { w: 150, h: 46 }, lx = rtl ? A.x1 - live.w : A.x0, ly = T.clock.y + T.clock.h - live.h;
  return {
    palette: P, mono,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(cv, 0, 0);
      ctx.fillStyle = P.panel; ctx.fillRect(lx, ly, live.w, live.h);
      ctx.strokeStyle = P.border; ctx.lineWidth = 1; ctx.strokeRect(lx + 0.5, ly + 0.5, live.w - 1, live.h - 1);
      const on = (time % 1) < 0.5;
      ctx.fillStyle = on ? P.accent : P.pending; ctx.fillRect(lx + 16, ly + live.h / 2 - 7, 14, 14);
      ctx.save(); ctx.font = `700 22px "${mono}"`; ctx.fillStyle = P.text; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.direction = 'ltr';
      ctx.fillText('LIVE', lx + 42, ly + live.h / 2 + 1); ctx.restore();
    },
  };
}
