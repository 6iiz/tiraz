// A small sign below the safe area: a lifted stylus tip (hover ring and lit point) beside the handle in the mono face. Decoration only.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x = SAFE.left + 12, y = SAFE.bottom + 70;
  return {
    draw(ctx, t = 0) {
      const b = Math.sin(t * 1.4) * 2;
      ctx.strokeStyle = rgba(pal.light, 0.4); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y + b, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(x, y + b, 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.light, 0.5); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 26, y + 1);
    },
  };
}
