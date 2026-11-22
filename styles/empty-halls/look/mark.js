// The camera's on-screen display, outside the safe area: a play mark and a running tape counter in the top corner, and the handle
// in the mono face at the bottom, all in the hall's pale light with a dark edge. Decoration only: the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const two = (n) => String(n).padStart(2, '0');
  const osd = (ctx, text, x, y, align, size) => {
    ctx.font = `600 ${size}px "${mono}"`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(text, x + 2, y + 2); ctx.fillStyle = P.fluo; ctx.fillText(text, x, y);
  };
  return {
    draw(ctx, t = 0) {
      ctx.save();
      const x = 90, y = 196;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(x + 2, y - 14); ctx.lineTo(x + 26, y + 2); ctx.lineTo(x + 2, y + 18); ctx.fill();
      ctx.fillStyle = P.fluo; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + 24, y); ctx.lineTo(x, y + 16); ctx.fill();
      const s = Math.floor(Math.max(0, t) + 754);
      osd(ctx, `${Math.floor(s / 3600)}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`, x + 44, y, 'left', 34);
      osd(ctx, brand.handle, SAFE.right, SAFE.bottom + 60, 'right', 24);
      ctx.restore();
    },
  };
}
