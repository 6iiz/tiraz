// A tiny accent hexagon and the handle in the mono face, just under the safe area on the reading side, above the island. Decoration only.
import { SAFE, mix } from '/engine/kit.js';
export async function create({ W, brand }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const c = mix(brand.colors.text, brand.colors.bg, 0.4), y = SAFE.bottom + 34, x = rtl ? SAFE.right - 10 : SAFE.left + 10;
  return {
    draw(ctx) {
      ctx.save(); ctx.fillStyle = brand.colors.accent; ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3, px = x + Math.cos(a) * 9, py = y + Math.sin(a) * 9; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = c; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(brand.handle, rtl ? x - 20 : x + 20, y + 1); ctx.restore();
    },
  };
}
