// The handle on the bottom of the front sheet, as small cuts with the lamp behind: drawn in the glow colour. Decoration only.
import { rgba } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 24px "${mono}"`; ctx.fillStyle = rgba(P.glow, 0.75); ctx.shadowColor = rgba(P.glow, 0.6); ctx.shadowBlur = 8;
      ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(brand.handle, W / 2, 1858); ctx.restore();
    },
  };
}
