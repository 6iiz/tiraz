// Below the safe area, above the dot band: a small accent dot with a key ring and the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
export async function create({ W, brand }) {
  const L = (h) => parseInt(h.slice(1, 3), 16) * 0.3 + parseInt(h.slice(3, 5), 16) * 0.59 + parseInt(h.slice(5, 7), 16) * 0.11;
  const night = L(brand.colors.text) >= L(brand.colors.bg) ? brand.colors.bg : brand.colors.text;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 72, x = SAFE.left + 14;
  return {
    draw(ctx) {
      ctx.save(); ctx.fillStyle = brand.colors.accent; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = night; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = night; ctx.font = `700 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + 26, y + 1); ctx.restore();
    },
  };
}
