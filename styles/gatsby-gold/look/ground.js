// The Gatsby ground: warm lacquer (the brand's darker colour) lifted toward the accent behind the centre, a fine sunburst of faint rays
// from the axis, and an engraved border with stepped corners, a hanging fan at the top and a rising fan at the foot. In the first
// second of the reel the border opens out from the axis; after that a band of light runs across the metal now and then, so the frame
// is never dead. Everything is drawn once into canvases; a frame lays them down and clips the bright copy to the moving band.
import { rgba, span } from '/engine/kit.js';
import { palette, E, gline, metal, sheenAt } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), cx = W / 2, cy = T.burst;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
  const [base, b] = mk();
  b.fillStyle = pal.dark; b.fillRect(0, 0, W, H);
  const lift = b.createRadialGradient(cx, cy, 0, cx, cy, H * 0.62);
  lift.addColorStop(0, rgba(pal.lift, 1)); lift.addColorStop(1, rgba(pal.lift, 0)); b.fillStyle = lift; b.fillRect(0, 0, W, H);
  b.fillStyle = pal.ray; b.beginPath();
  for (let i = 0; i < T.rays; i += 2) {
    const a0 = (i / T.rays) * Math.PI * 2, a1 = ((i + 0.55) / T.rays) * Math.PI * 2;
    b.moveTo(cx, cy); b.arc(cx, cy, H * 1.2, a0, a1); b.closePath();
  }
  b.globalAlpha = 0.55; b.fill(); b.globalAlpha = 1;
  const fall = b.createRadialGradient(cx, cy, H * 0.25, cx, cy, H * 0.8);       // the lacquer sinks toward the edges
  fall.addColorStop(0, rgba(pal.dark, 0)); fall.addColorStop(1, rgba(pal.dark, 0.85)); b.fillStyle = fall; b.fillRect(0, 0, W, H);

  // the border, its corners and the two fans, as one set of paths
  const m = 38, s = 34;
  const border = (c, k) => {
    const x0 = m + k, y0 = m + k, x1 = W - m - k, y1 = H - m - k, q = s;
    c.moveTo(x0 + q, y0); c.lineTo(x1 - q, y0); c.lineTo(x1 - q, y0 + q); c.lineTo(x1, y0 + q); c.lineTo(x1, y1 - q); c.lineTo(x1 - q, y1 - q);
    c.lineTo(x1 - q, y1); c.lineTo(x0 + q, y1); c.lineTo(x0 + q, y1 - q); c.lineTo(x0, y1 - q); c.lineTo(x0, y0 + q); c.lineTo(x0 + q, y0 + q); c.closePath();
  };
  const fan = (c, x, y, r, a0, a1, n) => {
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); c.moveTo(x + Math.cos(a) * r * 0.22, y + Math.sin(a) * r * 0.22); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    for (const k of [0.22, 0.62, 1]) { c.moveTo(x + Math.cos(a0) * r * k, y + Math.sin(a0) * r * k); c.arc(x, y, r * k, a0, a1); }
  };
  const paths = (c) => {
    c.beginPath(); border(c, 0); border(c, 14);
    fan(c, cx, m + 14, 150, 0, Math.PI, 12);                                        // hanging from the top edge
    fan(c, cx, H - m - 14, 230, Math.PI, Math.PI * 2, 16);                         // rising from the foot
    for (const [x, y, a] of [[m + 14, m + 14, 0], [W - m - 14, m + 14, Math.PI / 2], [W - m - 14, H - m - 14, Math.PI], [m + 14, H - m - 14, Math.PI * 1.5]])
      fan(c, x, y, 120, a, a + Math.PI / 2, 6);                                    // a quarter fan in each corner
  };
  const [dim, d] = mk();
  d.strokeStyle = pal.dim; d.lineWidth = 2; paths(d); d.stroke();
  const [bright, g] = mk();
  gline(g, paths, 2.4, pal, metal(g, 0, 0, W, H, pal, 0.5));

  return {
    pal,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(base, 0, 0);
      const open = E(span(time, -0.2, 0.9)), half = (W / 2) * open;                 // the border opens out from the axis
      if (open <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(cx - half, 0, half * 2, H); ctx.clip();
      ctx.drawImage(dim, 0, 0);
      const sw = sheenAt(time, T.sheen, 0.6), x = sw * (W + 800) - 400;            // a slanted band of light crossing the metal
      ctx.beginPath(); ctx.moveTo(x - 140, 0); ctx.lineTo(x + 140, 0); ctx.lineTo(x - 260, H); ctx.lineTo(x - 540, H); ctx.closePath(); ctx.clip();
      ctx.drawImage(bright, 0, 0);
      ctx.restore();
    },
  };
}
