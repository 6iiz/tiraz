// Below the safe area: a small doodled star in the fineliner with a dab of highlighter behind it, and the handle in the mono face.
// Decoration only: the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left + 16, y = SAFE.bottom + 72;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = P.hl; ctx.beginPath(); ctx.ellipse(x + 2, y + 2, 20, 14, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * (Math.PI * 4 / 5); ctx.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 15); }
      ctx.stroke();
      ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.note; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 34, y + 1);
      ctx.restore();
    },
  };
}
