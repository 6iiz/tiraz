// A small credit below the safe area: the handle in the mono face, widely spaced, under a short hairline of light with the accent split
// under it. Decoration only.
import { rgba, mix, contrast, SAFE } from '/engine/kit.js';
export async function create({ W, brand }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#ffffff') <= contrast(text, '#ffffff') ? bg : text, dark = light === bg ? text : bg;
  const latin = !/[؀-ۿ]/.test(brand.handle);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 78;
      ctx.save();
      ctx.fillStyle = rgba(accent, 0.7); ctx.fillRect(W / 2 - 60 + 2, y - 30 + 1.5, 120, 2);
      ctx.fillStyle = rgba(light, 0.8); ctx.fillRect(W / 2 - 60, y - 30, 120, 1.5);
      ctx.font = `400 20px "${mono}"`; if (latin && 'letterSpacing' in ctx) ctx.letterSpacing = '6px';
      ctx.fillStyle = mix(light, dark, 0.35); ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(latin ? brand.handle.toUpperCase() : brand.handle, W / 2, y);
      ctx.restore();
    },
  };
}
