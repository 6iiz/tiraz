// A technical note below the safe area, flat on top of the 3D: the handle in the mono face, small, in the ink at half strength,
// with a short rule above it. Decoration only (it may be covered by the app).
import { mix, SAFE } from '/engine/kit.js';
import { tones } from './ground.js';
export async function create({ brand, look }) {
  const tn = tones(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(tn.ink, tn.paper, 0.35);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 74, rtl = brand.dir !== 'ltr', x = rtl ? SAFE.right : SAFE.left;
      ctx.fillStyle = c; ctx.fillRect(rtl ? x - 150 : x, y - 30, 150, 2);
      ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = rtl ? 'right' : 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(brand.handle, x, y);
    },
  };
}
