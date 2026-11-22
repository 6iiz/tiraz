// A magnet and the handle in the mono face, below the safe area. Decoration only.
import { contrast, mix, rgba, SAFE } from '/engine/kit.js';
export async function create({ brand }) {
  const { bg, text } = brand.colors, ink = contrast(text, '#000000') < contrast(bg, '#000000') ? text : bg, board = ink === text ? bg : text;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(ink, board, 0.4), y = SAFE.bottom + 70, x = SAFE.left;
  return {
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = rgba('#000000', 0.2); ctx.beginPath(); ctx.arc(x + 14, y + 4, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = brand.colors.accent; ctx.beginPath(); ctx.arc(x + 11, y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 34, y); ctx.restore();
    },
  };
}
