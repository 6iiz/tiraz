// A tape counter below the safe area: a small lit record dot and the handle in the mono face, like the corner of a home-video
// playback screen. Decoration only.
import { SAFE, rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 80, x = SAFE.left + 6;
      ctx.save(); ctx.fillStyle = P.accent; ctx.shadowColor = P.accent; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x + 9, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = rgba(P.night, 0.9); ctx.shadowBlur = 6; ctx.fillStyle = P.light;
      ctx.font = `700 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('▶ ' + brand.handle, x + 30, y + 1);
      ctx.restore();
    },
  };
}
