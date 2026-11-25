// A small star-chart note below the safe area, flat on top of the 3D: a tiny orbit (an ellipse with its moon) and the handle in
// the mono face, at half strength. Decoration only (the app may cover it).
import { mix, SAFE } from '/engine/kit.js';
import { palette } from './ground.js';
export async function create({ brand }) {
  const P = palette(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, c = mix(P.light, P.sky, 0.45);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 74, rtl = brand.dir !== 'ltr', x = rtl ? SAFE.right : SAFE.left, ix = rtl ? x - 16 : x + 16;
      ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(ix, y - 8, 15, 5, -0.25, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(ix, y - 8, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(ix + 13, y - 11, 2, 0, Math.PI * 2); ctx.fill();
      ctx.font = `500 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = rtl ? 'right' : 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(brand.handle, rtl ? x - 42 : x + 42, y); ctx.restore();
    },
  };
}
