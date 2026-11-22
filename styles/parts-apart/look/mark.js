// A part tag below the safe area: three small offset slabs (the device, apart) and the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const pal = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      const y = SAFE.bottom + 78, x = rtl ? SAFE.right - 30 : SAFE.left;
      ctx.save();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i === 1 ? pal.accent : pal.wire; ctx.beginPath(); ctx.moveTo(x + 6, y - 6 - i * 11); ctx.lineTo(x + 30, y - 12 - i * 11); ctx.lineTo(x + 24, y - 18 - i * 11); ctx.lineTo(x, y - 12 - i * 11); ctx.fill(); }
      ctx.fillStyle = pal.wire; ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 14 : x + 44, y - 8);
      ctx.restore();
    },
  };
}
