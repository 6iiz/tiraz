// A small crayon star and the handle in the mono face, under the safe area on the reading side. Decoration only.
import { mix, contrast, SAFE } from '/engine/kit.js';
export async function create({ W, H, brand, look }) {
  const M = await import(look.base + 'motion.js'), P = M.palette(brand), K = M.masks(W, H), rtl = brand.dir !== 'ltr';
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 66, x = rtl ? SAFE.right - 20 : SAFE.left + 20;
  const star = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 8 : 18; star.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  return {
    draw(ctx, t) {
      const b = M.boilAt(t, 8);
      M.wax(ctx, K.heavy, [x - 30, y - 30, 60, 60], (c) => M.stroke(c, star, 5, P.deep, b % 3));
      ctx.save(); ctx.fillStyle = P.grey; ctx.font = `600 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 32 : x + 32, y + 1); ctx.restore();
    },
  };
}
