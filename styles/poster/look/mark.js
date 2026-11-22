// A small accent triangle pointing up the diagonal and the handle in the mono face, below the safe area. Decoration only.
import { mix, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(brand.colors.text, brand.colors.bg, 0.4);
  const y = SAFE.bottom + 72, x = SAFE.left;
  return {
    draw(ctx) {
      ctx.fillStyle = brand.colors.accent; ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x + 26, y + 12); ctx.lineTo(x + 26, y - 14); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.fillStyle = c; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle.toUpperCase(), x + 40, y); ctx.restore();
    },
  };
}
