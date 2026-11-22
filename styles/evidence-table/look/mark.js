// A small loupe ring and the handle in the mono face, below the safe area. Decoration only.
import { mix, contrast, SAFE } from '/engine/kit.js';
export async function create({ W, brand }) {
  const { bg, text } = brand.colors, dark = contrast(text, '#000000') < contrast(bg, '#000000') ? text : bg, light = dark === text ? bg : text;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(dark, light, 0.42), y = SAFE.bottom + 70, x = SAFE.left;
  return {
    draw(ctx) {
      ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 12, y, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = brand.colors.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 12, y, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = c; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 36, y); ctx.restore();
    },
  };
}
