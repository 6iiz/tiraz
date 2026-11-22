// Below the safe area: a small keyhole cut from the hot ink, and the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
import { inks, cut } from './motion.js';
export async function create({ W, brand }) {
  const I = inks(brand), mono = brand.fonts.mono?.family ?? brand.fonts.display.family, rtl = brand.dir !== 'ltr';
  const pts = []; for (let i = 0; i <= 20; i++) { const b = Math.PI * 0.75 + (i / 20) * Math.PI * 1.5; pts.push([Math.cos(b) * 11, -6 + Math.sin(b) * 11]); }
  pts.push([7, 16], [-7, 16]);
  const key = cut(pts, 300, 0.6);
  return {
    draw(ctx) {
      const y = SAFE.bottom + 74, x = rtl ? SAFE.right - 14 : SAFE.left + 14;
      ctx.save(); ctx.translate(x, y); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke(key); ctx.fillStyle = I.hot; ctx.fill(key); ctx.restore();
      ctx.save(); ctx.font = `700 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = rtl ? 'right' : 'left';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeText(brand.handle, rtl ? x - 26 : x + 26, y + 2);
      ctx.fillStyle = I.paper; ctx.fillText(brand.handle, rtl ? x - 26 : x + 26, y + 2); ctx.restore();
    },
  };
}
