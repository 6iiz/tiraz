// The Coded Gears ground: a flat, warm plate in the brand's lighter colour, no gradient and no vignette. A very faint wheel turns
// slowly in the lower corner, cut off by the frame, so the plate is never quite still; it sits below the text area.
import { mix } from '/engine/kit.js';
import { palette, gearPath } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand);
  const G = gearPath(36, 22, { bore: 0.3 }), c = mix(pal.ground, pal.ink, 0.022);
  return {
    pal,
    draw(ctx, t) {
      ctx.fillStyle = pal.ground; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(brand.dir !== 'ltr' ? 90 : W - 90, H - 120); ctx.rotate((t + clock) * 0.08); ctx.fillStyle = c; ctx.fill(G.path, 'evenodd'); ctx.restore();
    },
  };
}
