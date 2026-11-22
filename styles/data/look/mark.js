// A tiny three-bar glyph (the last bar in the accent) and the handle in the mono face, below the safe area. Decoration only.
import { mix, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(brand.colors.text, brand.colors.bg, 0.45);
  const y = SAFE.bottom + 72, x = SAFE.left;
  return {
    draw(ctx) {
      [10, 16, 24].forEach((h, i) => { ctx.fillStyle = i === 2 ? brand.colors.accent : c; ctx.fillRect(x + i * 9, y + 10 - h, 6, h); });
      ctx.save(); ctx.fillStyle = c; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, x + 40, y); ctx.restore();
    },
  };
}
