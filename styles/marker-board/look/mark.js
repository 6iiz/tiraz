// Below the safe area: a round accent magnet with its shadow, and the handle beside it in the mono face, in the lighter marker.
// Decoration only: the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left + 14, y = SAFE.bottom + 72;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.arc(x + 4, y + 5, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - 4, y - 5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.soft; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 30, y + 1);
      ctx.restore();
    },
  };
}
