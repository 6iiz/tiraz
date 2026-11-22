// The poster joint: a wide band of the accent is driven up the frame on a slant; the next scene is printed behind it.
// The band covers a fraction of the frame at any moment, so the cut never floods the frame with one colour.
import { ease } from '/engine/kit.js';
import { rad } from './motion.js';
export function create({ W, H, brand, look }) {
  const deg = -(Math.abs(look.tokens?.tilt ?? 6) + 12), R = Math.hypot(W, H) / 2 + 40, thick = 240, accent = brand.colors.accent;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p), e = (R + thick) - q * (2 * R + thick * 2);   // the band's lower edge, in the band's own frame
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rad(deg));
      ctx.beginPath(); ctx.rect(-R * 1.5, e, R * 3, R * 3); ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rad(deg)); ctx.fillStyle = accent; ctx.fillRect(-R * 1.5, e - thick, R * 3, thick); ctx.restore();
    },
  };
}
