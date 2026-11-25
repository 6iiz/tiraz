// A small brass-like name plate screwed to the front of the floor slab, under the safe area: the handle in the mono face.
// Decoration only (the app may cover it).
import { SAFE } from '/engine/kit.js';
import { tones } from './ground.js';
export async function create({ brand }) {
  const tn = tones(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr';
      const tw = ctx.measureText(brand.handle).width, pw = tw + 40, ph = 40, y = SAFE.bottom + 520;
      const x = rtl ? SAFE.right - pw : SAFE.left;
      ctx.fillStyle = tn.frame; ctx.beginPath(); ctx.roundRect(x, y, pw, ph, 4); ctx.fill();
      ctx.fillStyle = tn.board; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, pw - 6, ph - 6, 3); ctx.fill();
      ctx.fillStyle = tn.frame; for (const sx of [x + 10, x + pw - 10]) { ctx.beginPath(); ctx.arc(sx, y + ph / 2, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = tn.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + pw / 2, y + ph / 2 + 1);
      ctx.restore();
    },
  };
}
