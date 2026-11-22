// A street-name plate under the safe area: a small plate in the key colour on a short post, the handle on it in the mono face.
// Decoration only (not measured).
import { SAFE } from '/engine/kit.js';
import { palette } from './ground.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr';
      const tw = ctx.measureText(brand.handle).width, pw = tw + 32, ph = 40, y = SAFE.bottom + 96;
      const x = rtl ? SAFE.right - pw : SAFE.left;
      ctx.fillStyle = P.night; ctx.globalAlpha = 0.85; ctx.fillRect(x + pw / 2 - 3, y + ph, 6, 46);
      ctx.globalAlpha = 0.92; ctx.fillStyle = P.key; ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 6); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x + 4, y + 4, pw - 8, ph - 8, 4); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + pw / 2, y + ph / 2 + 1);
      ctx.restore();
    },
  };
}
