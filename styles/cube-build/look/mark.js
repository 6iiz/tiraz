// A small builder's tag below the safe area, flat on top of the 3D: three little squares (two in the text colour at half strength,
// one in the key colour) and the handle in the mono face. Decoration only (the app may cover it).
import { mix, SAFE } from '/engine/kit.js';
import { palette } from './ground.js';
export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(P.ink, P.mat, 0.45);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 78, rtl = brand.dir !== 'ltr', x = rtl ? SAFE.right : SAFE.left, s = 12, g = 4;
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k === 0 ? P.key : c; const xx = rtl ? x - (k + 1) * s - k * g : x + k * (s + g); ctx.fillRect(xx, y - 38, s, s); }
      ctx.fillStyle = c; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = rtl ? 'right' : 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(brand.handle, x, y);
    },
  };
}
