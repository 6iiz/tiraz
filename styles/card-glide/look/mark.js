// A small printed tab below the safe area: the brand's handle in the mono face on a strip of paper with a tiny accent cube, as if a
// label lay on the desk. Decoration only.
import { mix, contrast, rr, SAFE } from '/engine/kit.js';
export async function create({ W, brand, look }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, dark = light === bg ? text : bg;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 70, x = SAFE.left;
      ctx.save(); ctx.font = `600 22px "${mono}"`; const w = ctx.measureText(brand.handle).width + 70;
      ctx.fillStyle = mix(light, dark, 0.3); rr(ctx, x, y - 20 + 5, w, 40, 10); ctx.fill();
      ctx.fillStyle = light; rr(ctx, x, y - 20, w, 40, 10); ctx.fill();
      ctx.fillStyle = accent; ctx.fillRect(x + 14, y - 8, 16, 16);
      ctx.fillStyle = mix(dark, light, 0.3); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + 44, y + 1);
      ctx.restore();
    },
  };
}
