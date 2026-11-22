// The Ghost Overlay joint: the next scene is seen through a window. A gull's silhouette opens in the middle of the frame with the
// next scene printed inside it, and grows (with its rim darkened like a second exposure) until the new scene fills the frame.
import { ease, rgba, clamp } from '/engine/kit.js';
import { gull, palette } from './motion.js';
export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens), rtl = brand.dir !== 'ltr', path = gull(0.35);
  return {
    draw(ctx, from, to, p) {
      if (p >= 1) { ctx.drawImage(to, 0, 0); return; }
      ctx.drawImage(from, 0, 0);
      if (p <= 0) return;
      const e = ease.inOutCubic(p), s = 0.22 * Math.pow(70, e);
      ctx.save(); ctx.translate(W / 2 + (rtl ? 1 : -1) * 120 * (1 - e), H * 0.45); ctx.scale(rtl ? -s : s, s);
      ctx.clip(path);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.strokeStyle = rgba(P.ink, 0.25 * clamp(1 - e * 1.4)); ctx.lineWidth = 50; ctx.stroke(path);
      ctx.restore();
    },
  };
}
