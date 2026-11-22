// A small ink file chip below the safe area, the handle reversed out of it in the mono face. Decoration only.
import { contrast, SAFE } from '/engine/kit.js';
export async function create({ brand }) {
  const { bg, text } = brand.colors, ink = contrast(text, '#000000') < contrast(bg, '#000000') ? text : bg, paper = ink === text ? bg : text;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 70, x = SAFE.left;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `700 21px "${mono}"`; const w = ctx.measureText(brand.handle).width + 28;
      ctx.fillStyle = ink; ctx.fillRect(x, y - 17, w, 34); ctx.fillStyle = brand.colors.accent; ctx.fillRect(x, y - 17, 6, 34);
      ctx.fillStyle = paper; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + 17, y + 1); ctx.restore();
    },
  };
}
