// The cell-cinema joint: the sheet scrolls, the window does not. Inside the sheet area the old scene is wheeled up and the next one comes
// up from below, in whole rows (a scroll wheel's steps, not a glide); the shell above and below is the next scene's, which is the same.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const g = look.tokens.grid, top = g.top - g.headH, bottom = g.bottom, h = bottom - top, rh = g.rh * 2;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(to, 0, 0);
      const off = Math.round((ease.inOutCubic(p) * h) / rh) * rh;
      ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
      ctx.drawImage(from, 0, top, W, h, 0, top - off, W, h);
      ctx.drawImage(to, 0, top, W, h, 0, top - off + h, W, h);
      ctx.restore();
    },
  };
}
