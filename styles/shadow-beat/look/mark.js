// Below the dancers, on the dark water: the handle in the mono face in the sun's pale colour, small. Decoration only.
import { mix, contrast } from '/engine/kit.js';
export async function create({ W, brand }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, { bg, text, accent } = brand.colors;
  const paper = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, c = mix(paper, accent, 0.25);
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 24px "${mono}"`; ctx.direction = 'ltr'; ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.8; ctx.fillText(brand.handle, W / 2, 1760); ctx.restore();
    },
  };
}
