// The maker's mark: the handle pressed small into the table under the safe area, in the soft clay colour. Decoration only.
import { mix, SAFE } from '/engine/kit.js';
export async function create({ W, brand }) {
  const lum = (h) => { const n = parseInt(mix(h, h, 0).slice(1), 16); return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };
  const [light, dark] = lum(brand.colors.bg) >= lum(brand.colors.text) ? [brand.colors.bg, brand.colors.text] : [brand.colors.text, brand.colors.bg];
  const ink = mix(dark, light, 0.5), hi = mix(light, '#ffffff', 0.5);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx) {
      const y = SAFE.bottom + 80;
      ctx.font = `600 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = hi; ctx.fillText(brand.handle, W / 2 + 1, y + 1.5);          // the lit lower lip of a pressed groove
      ctx.fillStyle = ink; ctx.fillText(brand.handle, W / 2, y);
    },
  };
}
