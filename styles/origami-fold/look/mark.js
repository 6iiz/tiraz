// A small paper tag under the safe area, on the reading side: a slip of the paper colour with one corner folded down (the fold's
// back in shade), the handle printed on it in the mono face, and a soft shadow under it. Decoration only (not measured).
import { SAFE, rgba } from '/engine/kit.js';
import { palette } from './ground.js';

export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr';
      const tw = ctx.measureText(brand.handle).width, w = tw + 44, h = 44, y = SAFE.bottom + 92, x = rtl ? SAFE.right - w : SAFE.left, f = 14;
      ctx.shadowColor = rgba('#000000', 0.28); ctx.shadowBlur = 12; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
      ctx.fillStyle = P.paper; ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + w - f, y); ctx.lineTo(x + w, y + f); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = P.back; ctx.beginPath(); ctx.moveTo(x + w - f, y); ctx.lineTo(x + w - f, y + f); ctx.lineTo(x + w, y + f); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba('#000000', 0.12); ctx.fillRect(x + w - f, y, 1, f);
      ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, x + w / 2 - 4, y + h / 2 + 1);
      ctx.restore();
    },
  };
}
