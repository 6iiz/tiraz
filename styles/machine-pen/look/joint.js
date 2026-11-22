// The machine-pen joint: the sheet is fed out. The finished page travels up out of the machine with the plotter's trapezoid of speed
// and the next sheet follows it in from below, joined along a perforated tear line. The rails of the bed stay where they are.
import { rgba } from '/engine/kit.js';
import { trap } from './motion.js';
export async function create({ W, H, brand, look }) {
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look });
  const K = ground.K;
  return {
    draw(ctx, from, to, p) {
      const y = -H * trap(p);
      ctx.drawImage(from, 0, y); ctx.drawImage(to, 0, y + H);
      const seam = y + H;
      ctx.fillStyle = rgba('#000000', 0.10); ctx.fillRect(0, seam, W, 8);
      ctx.fillStyle = K.rule; for (let x = 0; x < W; x += 22) ctx.fillRect(x, seam - 1, 12, 2);
      ground.rails(ctx);
    },
  };
}
