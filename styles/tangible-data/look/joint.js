// The tangible-data joint: a camera crane. The set we leave rises out of the top of the frame while the next set rises into view from
// below, as if the camera were lowered through the studio; where they meet, a band of soft floor shadow passes. Tonal, never a flash.
import { ease, rgba } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), y = Math.round(-q * H);
      ctx.drawImage(from, 0, y); ctx.drawImage(to, 0, y + H);
      const g = ctx.createLinearGradient(0, y + H - 160, 0, y + H + 60);
      g.addColorStop(0, rgba('#000000', 0)); g.addColorStop(0.75, rgba('#000000', 0.16)); g.addColorStop(1, rgba('#000000', 0));
      ctx.fillStyle = g; ctx.fillRect(0, y + H - 160, W, 220);
    },
  };
}
