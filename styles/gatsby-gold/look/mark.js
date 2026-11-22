// A small engraved signature below the safe area, on the axis: the handle in the mono face between two hairlines with diamonds.
// Decoration only; the app may cover it.
import { SAFE } from '/engine/kit.js';
import { palette, diamond } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const y = SAFE.bottom + 74, cx = W / 2;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `500 21px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(brand.handle).width;
      ctx.fillStyle = pal.dim;
      for (const s of [-1, 1]) { ctx.fillRect(s < 0 ? cx - w / 2 - 70 : cx + w / 2 + 16, y - 0.75, 54, 1.5); diamond(ctx, cx + s * (w / 2 + 78), y, 4, pal.dim); }
      ctx.fillStyle = pal.muted; ctx.globalAlpha = 0.7; ctx.fillText(brand.handle, cx, y);
      ctx.restore();
    },
  };
}
