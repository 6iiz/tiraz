// A sync badge under the safe area: a square accent dot, the word SYNC and the handle in the mono face. Decoration only.
import { mix, contrast, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const { bg, text, accent } = brand.colors, lum = (h) => contrast(h, '#000000');
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(light, dark, 0.45);
  const y = SAFE.bottom + 74, x = SAFE.left;
  return {
    draw(ctx) {
      ctx.fillStyle = accent; ctx.fillRect(x, y - 7, 14, 14);
      ctx.save(); ctx.fillStyle = c; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('SYNC', x + 26, y + 1); ctx.fillStyle = mix(light, dark, 0.7); ctx.fillRect(x + 92, y - 10, 1.5, 20); ctx.fillStyle = c; ctx.fillText(brand.handle, x + 106, y + 1); ctx.restore();
    },
  };
}
