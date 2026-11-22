// Below the safe area: a short accent rail at the reading edge and the handle in the mono face, dim. Decoration only.
import { mix, contrast } from '/engine/kit.js';
export async function create({ W, brand }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, { bg, text, accent } = brand.colors;
  const [paper, ink] = contrast(bg, '#000000') >= contrast(text, '#000000') ? [bg, text] : [text, bg];
  const rtl = brand.dir !== 'ltr', y = 1330, c = mix(ink, paper, 0.55);
  return {
    draw(ctx) {
      ctx.save(); ctx.fillStyle = accent; ctx.fillRect(rtl ? W - 34 : 0, y - 16, 34, 32);
      ctx.font = `700 24px "${mono}"`; ctx.direction = 'ltr'; ctx.fillStyle = c; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? W - 60 : 60, y + 1);
      ctx.restore();
    },
  };
}
