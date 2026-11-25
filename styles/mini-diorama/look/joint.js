// The mini-diorama joint: the shop's rolling shutter. It rolls down over the old room, slat by slat, and rolls straight back up
// on the new one. The slats are the room's own wall tone, so the frame's brightness hardly moves; a light cap rail leads the edge.
import { tones } from './ground.js';
import { inOut } from './motion.js';
export function create({ W, H, brand }) {
  const tn = tones(brand), slat = 46;
  const sheet = document.createElement('canvas'); sheet.width = W; sheet.height = H;
  const g = sheet.getContext('2d');
  for (let y = 0; y < H; y += slat) {
    const gr = g.createLinearGradient(0, y, 0, y + slat);
    gr.addColorStop(0, tn.side); gr.addColorStop(0.55, tn.wall); gr.addColorStop(1, tn.under);
    g.fillStyle = gr; g.fillRect(0, y, W, slat);
    g.fillStyle = tn.under; g.fillRect(0, y + slat - 3, W, 3);
  }
  return {
    draw(ctx, from, to, p) {
      const down = p < 0.5, q = down ? inOut(p / 0.5) : 1 - inOut((p - 0.5) / 0.5);
      ctx.drawImage(down ? from : to, 0, 0);
      const y = Math.round(H * q); if (y <= 0) return;
      ctx.drawImage(sheet, 0, y - H);                                  // the slats travel with the edge
      ctx.fillStyle = tn.cap; ctx.fillRect(0, y - 22, W, 22);
      ctx.fillStyle = tn.under; ctx.fillRect(0, y - 4, W, 4);
    },
  };
}
