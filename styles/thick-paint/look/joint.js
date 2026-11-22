// The thick-paint joint: one broad pass of a loaded knife across the whole frame, on a slant, from the reading side. The blade pushes a
// wide band of paint (the ground's colour a step lighter, so the frame's brightness hardly moves); behind the band the next scene is
// already painted. The band is built once.
import { mix } from '/engine/kit.js';
import { palette, plane, K } from './motion.js';
export function create({ W, H, brand, look }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', a = (rtl ? 1 : -1) * 0.32, thick = 300, R = Math.hypot(W, H) / 2 + 60;
  const band = plane(R * 2 + 200, thick, mix(P.ground, P.paint, 0.14), [P.paint, P.ground, P.accent], 4040, { row: 54 });
  const ux = rtl ? -Math.cos(a) : Math.cos(a), uy = rtl ? -Math.sin(a) : Math.sin(a);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const e = -R - thick + K(p) * (2 * R + thick * 2);          // where the middle of the band is, along the pass
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.transform(ux, uy, -uy, ux, 0, 0);
      ctx.beginPath(); ctx.rect(-R * 3, -R * 2, R * 3 + e, R * 4); ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.transform(ux, uy, -uy, ux, 0, 0); ctx.rotate(Math.PI / 2);
      ctx.drawImage(band.cv, -R - 100 - band.pad, -e - thick / 2 - band.pad);
      ctx.restore();
    },
  };
}
