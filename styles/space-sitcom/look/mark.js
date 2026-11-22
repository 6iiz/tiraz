// Over every frame: a tiny broadcast bug in the bottom corner, the way a cable channel marks its cartoons: the handle in the mono face
// on a dark strip with a boiling outline and an accent dot that pulses. Decoration only; it sits below the safe area.
import { palette, shape, box, drawing } from './motion.js';
import { SAFE } from '/engine/kit.js';
export async function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const mctx = document.createElement('canvas').getContext('2d'); mctx.font = `600 22px "${mono}"`;
  const w = mctx.measureText(brand.handle).width + 70, x1 = SAFE.right, x0 = x1 - w, y0 = H - 118, y1 = y0 + 46;
  return {
    draw(ctx, t) {
      const k = drawing(t);
      ctx.save(); ctx.globalAlpha = 0.9;
      shape(ctx, P, box(x0, y0, x1, y1, 14), k, { fill: P.screen, width: 4, seed: 201 });
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(x0 + 24, (y0 + y1) / 2, 7 + 2 * Math.sin(t * 5), 0, Math.PI * 2); ctx.fill();
      ctx.font = `600 22px "${mono}"`; ctx.fillStyle = P.light; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x0 + 44, (y0 + y1) / 2 + 1);
      ctx.restore();
    },
  };
}
