// A small crayon cube and the handle in the mono face, under the safe area on the reading side. Decoration only.
import { SAFE } from '/engine/kit.js';
export async function create({ W, H, brand, look }) {
  const M = await import(look.base + 'motion.js'), P = M.palette(brand), C = M.sets(P), rtl = brand.dir !== 'ltr';
  const cube = M.solid(W, H, { w: 26, h: 26, D: 10, ...C.key, seed: 2, draw: (g, c) => { g.fillStyle = c; g.fillRect(0, 0, 26, 26); } });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, y = SAFE.bottom + 70, x = rtl ? SAFE.right - 30 : SAFE.left + 4;
  return {
    draw(ctx) {
      ctx.drawImage(cube.cv, x - cube.ox, y - 13 - cube.oy);
      ctx.save(); ctx.fillStyle = P.dim; ctx.font = `700 24px "${mono}"`; ctx.direction = 'ltr'; ctx.textBaseline = 'middle';
      ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(brand.handle, rtl ? x - 26 : x + 46, y + 1); ctx.restore();
    },
  };
}
