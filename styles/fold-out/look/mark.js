// The handle printed small at the foot of the floor page, like a running footer of the book, with a little accent tab beside it. Decoration only.
import { rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.fillStyle = rgba(P.ink, 0.6); ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, W / 2, 1800);
      const w = ctx.measureText(brand.handle).width; ctx.fillStyle = P.accent; ctx.beginPath(); ctx.roundRect(W / 2 + w / 2 + 16, 1791, 26, 18, 4); ctx.fill();
      ctx.restore();
    },
  };
}
