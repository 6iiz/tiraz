// A small paper tag pinned under the safe area on the reading side, with the handle in the mono face. Decoration only.
import { SAFE } from '/engine/kit.js';
export async function create({ W, H, brand, look }) {
  const M = await import(look.base + 'motion.js'), P = M.palette(brand), rtl = brand.dir !== 'ltr';
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const mc = document.createElement('canvas').getContext('2d'); mc.font = `700 22px "${mono}"`;
  const w = mc.measureText(brand.handle).width + 60, h = 40, y = SAFE.bottom + 80, cx = rtl ? SAFE.right - w / 2 - 10 : SAFE.left + w / 2 + 10;
  const tag = M.torn(w, h, 99, 3);
  return {
    draw(ctx) {
      ctx.save(); ctx.translate(cx, y); ctx.rotate(-0.02);
      M.paper(ctx, tag, P.paper, P, { shadow: 0.6, edge: P.ink, edgeW: 2 });
      ctx.fillStyle = P.ink; ctx.font = `700 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, 12, 1); M.pin(ctx, -w / 2 + 16, 0, P, 7); ctx.restore();
    },
  };
}
