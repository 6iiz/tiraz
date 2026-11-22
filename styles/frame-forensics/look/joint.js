// The Frame Forensics joint: a scrub. A playhead (a thin accent line with a timecode tag riding on it) crosses the frame from the
// reading side; behind it is the next layout, ahead of it the old one, held a step darker as if paused. Hard edge, no fade.
import { ease } from '/engine/kit.js';
import { palette, tc, code } from './motion.js';
export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx, from, to, p, info = {}) {
      const e = ease.inOutCubic(p), x = rtl ? W - W * e : W * e;
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      if (rtl) ctx.drawImage(to, x, 0, W - x, H, x, 0, W - x, H); else ctx.drawImage(to, 0, 0, x, H, 0, 0, x, H);
      if (p > 0 && p < 1) {
        ctx.fillStyle = P.mark; ctx.fillRect(x - 1.5, 0, 3, H);
        ctx.fillStyle = P.mark; ctx.fillRect(rtl ? x : x - 150, 236, 150, 34);
        code(ctx, tc(info.t ?? 0, look.tokens.fps).slice(3), rtl ? x + 75 : x - 75, 253, { mono, size: 20, color: P.onAccent, align: 'center', weight: 700 });
      }
    },
  };
}
