// An exhibit caption under the safe area: a tiny stack of three plates (the top one in the accent) and the handle in the mono face.
// Decoration only.
import { mix, contrast, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const { bg, text, accent } = brand.colors, lum = (h) => contrast(h, '#000000');
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(dark, light, 0.45);
  const y = SAFE.bottom + 74, x = SAFE.left;
  return {
    draw(ctx) {
      [0, 1, 2].forEach((k) => { ctx.fillStyle = k === 2 ? accent : c; ctx.fillRect(x + (k % 2) * 2, y + 10 - k * 8, 28, 6); });
      ctx.save(); ctx.fillStyle = c; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 44, y + 2); ctx.restore();
    },
  };
}
