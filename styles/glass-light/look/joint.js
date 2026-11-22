// The glass joint: a slow band of light crosses the frame from the reading side. Where it has passed, the next scene is already there;
// the band itself is a soft additive glow in the brand's light colour, slanted like the band on the studio wall that it continues
// (the 3D scenes move their own wall band and rim light in step, see motion.js sweep()). No hard edge, no flash.
import { palette } from './motion.js';
import { rgba } from '/engine/kit.js';

export function create({ W, H, brand, look }) {
  const P = palette(brand), J = look.tokens.dur.joint, rtl = brand.dir !== 'ltr', slant = 0.32 * H, soft = 260;
  const mask = document.createElement('canvas'); mask.width = W; mask.height = H; const m = mask.getContext('2d');
  return {
    draw(ctx, from, to, p) {
      const x = W + 570 - p * (W + 1140), X = rtl ? x : W - x;        // the band's centre at the frame's middle height
      ctx.drawImage(from, 0, 0);
      // the next scene through a soft slanted edge that follows the band
      m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W, H); m.drawImage(to, 0, 0);
      m.globalCompositeOperation = 'destination-in';
      const g = m.createLinearGradient(X - soft, 0, X + soft, 0);
      g.addColorStop(0, rtl ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)'); g.addColorStop(1, rtl ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
      m.save(); m.translate(W / 2, H / 2); m.transform(1, 0, -slant / H, 1, 0, 0); m.translate(-W / 2, -H / 2);
      m.fillStyle = g; m.fillRect(-W, -H, 3 * W, 3 * H); m.restore();
      ctx.drawImage(mask, 0, 0);
      // the band of light
      const k = Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.translate(W / 2, H / 2); ctx.transform(1, 0, -slant / H, 1, 0, 0); ctx.translate(-W / 2, -H / 2);
      const b = ctx.createLinearGradient(X - 220, 0, X + 220, 0);
      b.addColorStop(0, rgba(P.ink, 0)); b.addColorStop(0.5, rgba(P.ink, 0.06 * k)); b.addColorStop(1, rgba(P.ink, 0));
      ctx.fillStyle = b; ctx.fillRect(-W, -H, 3 * W, 3 * H); ctx.restore();
    },
  };
}
