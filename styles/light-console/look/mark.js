// A telemetry row below the safe area: a small hue diamond that turns, then the handle in the mono face, and a hairline that runs on
// to the frame's corner bracket. Decoration only.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const pal = palette(brand, look.tokens), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 190, x = SAFE.left;
  return {
    draw(ctx, t) {
      ctx.save(); ctx.translate(x + 8, y); ctx.rotate(Math.PI / 4 + t * 0.6); ctx.strokeStyle = pal.hue; ctx.lineWidth = 2; ctx.strokeRect(-6, -6, 12, 12); ctx.restore();
      ctx.save(); ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.light, 0.5); ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
      const s = brand.handle; ctx.fillText(s, x + 30, y + 1); const w = ctx.measureText(s).width;
      ctx.fillStyle = rgba(pal.hue, 0.3); ctx.fillRect(x + 46 + w, y, W - 96 - (x + 46 + w), 1.5); ctx.restore();
    },
  };
}
