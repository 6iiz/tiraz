// A small recorder badge below the safe area: a round dot of the accent and the handle in the mono face on a dark glassy pill.
// Decoration only.
import { rgba, contrast, rr, SAFE } from '/engine/kit.js';
export async function create({ W, brand }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, dark = light === bg ? text : bg;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 74, x = SAFE.left;
      ctx.save(); ctx.font = `600 22px "${mono}"`; const w = ctx.measureText(brand.handle).width + 72;
      ctx.fillStyle = rgba(dark, 0.55); rr(ctx, x, y - 22, w, 44, 22); ctx.fill();
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(x + 24, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = light; ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + 44, y + 1);
      ctx.restore();
    },
  };
}
