// The intertitle joint: the iris. A soft-edged circle closes on the old card toward the middle of the screen, and opens again on the new
// one. It moves in film frames (24 a second), and what the iris covers is the picture house's own darkness, a step of tone from the dark
// print, so the cut never flashes.
import { rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look }) {
  const M = await import(look.base + 'motion.js'), P = M.palette(brand);
  const R = Math.hypot(W, H) / 2 + 40, cx = W / 2, cy = 760;
  const sm = (q) => q * q * (3 - 2 * q);
  return {
    draw(ctx, from, to, p) {
      const q = Math.floor(p * 30) / 30;                    // the iris turns in steps (0.5 s joint = 30 film frames)
      const closing = q < 0.5, k = closing ? 1 - q / 0.5 : (q - 0.5) / 0.5;
      ctx.drawImage(closing ? from : to, 0, 0);
      const r = R * sm(Math.min(1, Math.max(0, k)));
      const g = ctx.createRadialGradient(cx, cy, Math.max(0, r - 34), cx, cy, r + 0.5);
      g.addColorStop(0, rgba(P.house, 0)); g.addColorStop(1, P.house);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  };
}
