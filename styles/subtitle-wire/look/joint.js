// The subtitle-wire joint: a hard cut on the beat with a punch. The outgoing shot pushes in a few percent for the first half, then the
// incoming shot starts a little large and snaps to its frame. No wipe, no blend: one shot replaces the other.
import { ease } from '/engine/kit.js';
export function create({ W, H }) {
  const zoom = (ctx, img, s) => { ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.scale(s, s); ctx.translate(-W / 2, -H * 0.42); ctx.drawImage(img, 0, 0); ctx.restore(); };
  return {
    draw(ctx, from, to, p) {
      if (p < 0.5) zoom(ctx, from, 1 + 0.035 * ease.inQuad(p * 2));
      else zoom(ctx, to, 1.05 - 0.05 * ease.outExpo((p - 0.5) * 2));
    },
  };
}
