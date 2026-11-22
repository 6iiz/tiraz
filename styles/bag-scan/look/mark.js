// On the console's bottom bar, beside the function keys row: the handle in the mono face, as the station's name. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, H, brand, look }) {
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, pal = palette(brand), rtl = brand.dir !== 'ltr';
  const y = H - look.tokens.console.bottom + 140;
  return {
    draw(ctx) {
      ctx.fillStyle = pal.chromeInk; ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? W - 40 : 40, y);
      ctx.fillStyle = pal.mixed; ctx.beginPath(); ctx.arc(rtl ? 40 + 8 : W - 48, y, 8, 0, Math.PI * 2); ctx.fill();
    },
  };
}
