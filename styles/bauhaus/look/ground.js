// The Bauhaus ground: flat paper in the brand's light colour, and below the safe area a standing composition of the three primaries
// (an accent half-disc on the bottom edge, a heavy ink diagonal, a mid-tone square, a small ink circle). It assembles in the first
// second of the reel, each shape arriving from its own edge with weight, then stands still; it uses `clock`, so a cut does not rebuild it.
// It hands the parts the palette and `slab`, the solid block that text is set on.
import { span } from '/engine/kit.js';
import { palette, heavy, circle, square, bar } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand, look), rtl = brand.dir !== 'ltr', dir = rtl ? 1 : -1;
  const sx = (x) => (rtl ? x : W - x);                        // x measured from the far end of the reading line
  return {
    P, rtl, dir, sx, paper: P.paper, ink: P.ink,
    // A solid block from x0 to x1 around ymid, h tall. p slides it in from the reading side's edge of the frame.
    slab(ctx, p, x0, x1, ymid, h, fill) {
      if (p <= 0) return;
      const q = heavy(p), off = rtl ? (W - x0) * (1 - q) : -x1 * (1 - q);
      ctx.fillStyle = fill; ctx.fillRect(x0 + off, ymid - h / 2, x1 - x0, h);
    },
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      const k = (i) => span(time, -0.6 + i * 0.12, 0.1 + i * 0.12);
      bar(ctx, k(0), sx(-40), H - 600, sx(760), H + 40, 70, P.ink);
      circle(ctx, k(1), sx(790), H, 330, P.accent, { x: dir * -700, y: 0 });
      square(ctx, k(2), sx(250), H - 250, 220, P.mid, { x: 0, y: 500 }, 0.26);
      circle(ctx, k(3), sx(960), H - 520, 46, P.ink, { x: 0, y: -400 });
    },
  };
}
