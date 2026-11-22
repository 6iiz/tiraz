// Below the safe area: the camera's status line, the handle in the mono face beside a short strip of the heat ramp. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, pal = palette(brand), rtl = brand.dir !== 'ltr';
  const strip = document.createElement('canvas'); strip.width = 120; strip.height = 8;
  { const s = strip.getContext('2d'); for (let x = 0; x < 120; x++) { const c = pal.lut[Math.round(x / 119 * 255)]; s.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; s.fillRect(x, 0, 1, 8); } }
  return {
    draw(ctx) {
      const y = SAFE.bottom + 70, x = rtl ? SAFE.right - 120 : SAFE.left;
      ctx.drawImage(strip, x, y - 34);
      ctx.fillStyle = pal.dim; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? SAFE.right : SAFE.left, y);
    },
  };
}
