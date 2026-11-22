// The buddy-screen joint: the recorder's push-in cut. The outgoing frame zooms on towards the middle and thins away while the incoming
// frame settles from a few percent smaller, both over the same wallpaper, so nothing flashes and the window seems to hand over to itself.
import { ease } from '/engine/kit.js';
export function create({ W, H }) {
  return {
    draw(ctx, from, to, p) {
      if (p <= 0) { ctx.drawImage(from, 0, 0); return; }
      if (p >= 1) { ctx.drawImage(to, 0, 0); return; }
      const q = ease.inOutCubic(p), a = 0.94 + 0.06 * ease.outCubic(p), b = 1 + 0.22 * ease.inQuad(p);
      ctx.save(); ctx.drawImage(to, W / 2 - (W * a) / 2, H / 2 - (H * a) / 2, W * a, H * a);
      ctx.globalAlpha = 1 - q; ctx.drawImage(from, W / 2 - (W * b) / 2, H / 2 - (H * b) / 2, W * b, H * b); ctx.restore();
    },
  };
}
