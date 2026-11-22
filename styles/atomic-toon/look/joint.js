// The atomic-toon joint: a flat plane of colour is slid across like a painted card pulled by hand, in held drawings (it moves on
// twos, in five jumps), with a broken ink edge; the next room is printed behind it. The plane is a pale tint, close to the walls,
// so the frame's brightness hardly moves.
import { ease, mix } from '/engine/kit.js';
import { palette, cel } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', band = 300, plane = mix(P.paper, P.accent, 0.32);
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(Math.ceil(p * 6) / 6), lead = q * (W + band);       // the plane's leading edge, from the reading side
      ctx.drawImage(from, 0, 0);
      const tail = lead - band;                                       // behind the plane: the new room
      if (tail > 0) { ctx.save(); ctx.beginPath(); ctx.rect(rtl ? W - tail : 0, 0, tail, H); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore(); }
      const bx = rtl ? W - lead : tail, bw = band;
      ctx.fillStyle = plane; ctx.fillRect(bx, 0, bw, H);
      for (const x of [bx, bx + bw]) { const e = new Path2D(); e.moveTo(x, -10); e.lineTo(x, H + 10); cel(ctx, e, { line: P.ink, width: 6, id: 200 + (x === bx ? 0 : 1), t: p * 2, gaps: 0.2 }); }
    },
  };
}
