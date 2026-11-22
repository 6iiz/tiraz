// Below the safe area, on the sheet: a small two-ink swatch pair and the handle in the mono face, like a printer's slug line.
// Decoration only.
import { mix, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const { bg, text, accent } = brand.colors;
  const L = (h) => parseInt(h.slice(1, 3), 16) * 0.3 + parseInt(h.slice(3, 5), 16) * 0.59 + parseInt(h.slice(5, 7), 16) * 0.11;
  const paper = L(text) >= L(bg) ? text : bg, night = paper === text ? bg : text, c = mix(night, paper, 0.4);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 72, x = SAFE.left;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = night; ctx.fillRect(x, y - 10, 20, 20); ctx.fillStyle = accent; ctx.fillRect(x + 24, y - 10, 20, 20);
      ctx.fillStyle = c; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + 58, y + 1);
      ctx.restore();
    },
  };
}
