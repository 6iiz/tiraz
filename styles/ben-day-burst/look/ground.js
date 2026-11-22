// The ben-day-burst ground: a bare sheet of the brand's light colour. Below the safe area, where nothing has to be read, the sheet
// carries a band of the oversized dot screen in the pale tint, so the page always shows its screen. It also builds, once per scene,
// the page-fixed dot sheets the prints use, one per dot colour.
import { palette, dotSheet } from './motion.js';

export function create({ W, H, brand, look }) {
  const T = look.tokens, P = palette(brand, T);
  const dots = {};
  for (const c of [P.tint, P.shade, P.accent]) if (!dots[c]) dots[c] = dotSheet(W, H, c, T.dots.cell);
  const band = { x: 0, y: 1380, w: W, h: H - 1380 };
  return {
    P, dots,
    draw(ctx) {
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(dots[P.tint], band.x, band.y, band.w, band.h, band.x, band.y, band.w, band.h);
      ctx.fillStyle = P.night; ctx.fillRect(0, band.y - 10, W, 10);
    },
  };
}
