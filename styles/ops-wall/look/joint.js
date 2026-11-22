// The ops-wall joint: the camera pans along the one wall. The last scene slides away against the reading direction while the next
// part of the wall comes in beside it, the two edge to edge, with a slight motion blur at the fastest moment. Board beside board,
// so it never flashes.
import { ease } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', s = rtl ? 1 : -1;
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), x = s * W * q, blur = Math.sin(Math.PI * Math.min(1, Math.max(0, p))) * 6;
      ctx.save(); if (blur > 0.5) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      ctx.drawImage(from, x, 0); ctx.drawImage(to, x - s * W, 0);
      ctx.restore();
    },
  };
}
