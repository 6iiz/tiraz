// A small tag on the stage floor, below the safe area: the handle in the mono face on an ink pill. Decoration only.
import { contrast } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, { bg, text } = brand.colors;
  const [paper, ink] = contrast(bg, '#000000') >= contrast(text, '#000000') ? [bg, text] : [text, bg];
  const y = look.tokens.floor + 120;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `700 24px "${mono}"`; ctx.direction = 'ltr';
      const w = ctx.measureText(brand.handle).width + 40;
      ctx.fillStyle = ink; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - 22, w, 44, 22); ctx.fill();
      ctx.fillStyle = paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, W / 2, y + 1);
      ctx.restore();
    },
  };
}
