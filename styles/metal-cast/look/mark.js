// A hallmark under the safe area: the handle in the mono face inside a thin stamped frame, in a metal tone between the brand's light
// and dark. Decoration only (the app may cover it).
import { mix, contrast, SAFE } from '/engine/kit.js';
export async function create({ W, brand }) {
  const { bg, text } = brand.colors, dark = contrast(bg, '#000000') <= contrast(text, '#000000') ? bg : text, light = dark === bg ? text : bg;
  const c = mix(light, dark, 0.55), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 74;
      ctx.font = `600 21px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(brand.handle).width + 30;
      ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - 18, w, 36, 6); ctx.stroke();
      ctx.fillStyle = c; ctx.fillText(brand.handle, W / 2, y + 1);
    },
  };
}
