// The word-strobe joint: a shutter of horizontal slats. Each slat cuts from the old scene to the new one on its own frame, in a fixed
// scrambled order, so the change stutters down the frame like a run of cut-in cards. No slide, no fade. Both scenes stand on the same
// dark ground, so the frame's brightness hardly moves.
import { rng } from '/engine/kit.js';
export function create({ W, H }) {
  const n = 16, h = H / n, r = rng(88), at = [];
  for (let i = 0; i < n; i++) at.push(0.08 + r() * 0.8);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (let i = 0; i < n; i++) if (p >= at[i]) ctx.drawImage(to, 0, i * h, W, h + 1, 0, i * h, W, h + 1);
    },
  };
}
