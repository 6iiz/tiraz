// One firefly by the handle, under the safe area on the reading side: it blinks slowly through the whole reel. Decoration only.
import { rgba, mix, SAFE } from '/engine/kit.js';
import { palette, sprite } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const sp = sprite(pal.spark, mix(pal.spark, '#ffffff', 0.5));
  return {
    draw(ctx, t) {
      const y = SAFE.bottom + 90;
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.lead, 0.75); ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? SAFE.right : SAFE.left, y + 1);
      const w = ctx.measureText(brand.handle).width, x = rtl ? SAFE.right - w - 26 : SAFE.left + w + 26;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.7 * Math.max(0, Math.sin(t * 1.7)) ** 3; ctx.drawImage(sp, x - 14, y - 14, 28, 28);
      ctx.restore();
    },
  };
}
