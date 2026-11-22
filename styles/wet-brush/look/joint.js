// The wet brush joint: a broad stroke of clean, wet paper is brushed across the page on a slight slant, in the reading direction, lifting
// the old painting off; the new page is already painted behind it. The stroke has ragged edges with a faint rim of the pigment at its
// leading edge. Paper over paper: the brightness of the frame hardly moves.
import { rng, rgba, mix, contrast } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const { bg, text, accent } = brand.colors, lum = (c) => contrast(c, '#000000');
  const paper = lum(bg) >= lum(text) ? bg : text, rtl = brand.dir !== 'ltr', rim = rgba(mix(paper, accent, 0.5), 0.5);
  const r = rng(404), edge = Array.from({ length: 41 }, () => (r() - 0.5) * 60), edge2 = Array.from({ length: 41 }, () => (r() - 0.5) * 36);
  const band = 420, slant = 0.18 * H;
  const front = (x, e) => Array.from({ length: 41 }, (_, k) => [x + e[k] + (k / 40 - 0.5) * slant * (rtl ? -1 : 1), (k / 40) * H]);
  const path = (ctx, a, b) => { ctx.beginPath(); a.forEach(([x, y]) => ctx.lineTo(x, y)); [...b].reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); };
  return {
    draw(ctx, from, to, p) {
      const q = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2, travel = W + band + slant + 120;
      const lead = rtl ? W + 60 + slant / 2 - q * travel : -60 - slant / 2 + q * travel, tail = rtl ? lead + band : lead - band;
      const A = front(lead, edge), Bk = front(tail, edge2), far = rtl ? W + 3000 : -3000;
      ctx.drawImage(from, 0, 0);
      ctx.save(); path(ctx, Bk, front(far, edge2)); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.save(); path(ctx, A, Bk); ctx.fillStyle = rgba(paper, 0.94); ctx.fill();
      ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.beginPath(); A.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.stroke(); ctx.restore();
    },
  };
}
