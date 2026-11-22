// The Heat Vision joint: the camera re-samples. The old picture breaks into ever coarser sensor cells, the next one comes in at the
// coarsest grain and resolves back to full detail. Hard cells, no smoothing, no fade.
export function create({ W, H }) {
  const small = document.createElement('canvas'), s = small.getContext('2d');
  const cell = (q) => Math.max(1, Math.round(2 + 46 * q * q));
  return {
    draw(ctx, from, to, p) {
      const src = p < 0.5 ? from : to, q = p < 0.5 ? p * 2 : (1 - p) * 2, c = cell(q);
      if (c <= 2) { ctx.drawImage(src, 0, 0); return; }
      const w = Math.ceil(W / c), h = Math.ceil(H / c);
      if (small.width !== w || small.height !== h) { small.width = w; small.height = h; }
      s.imageSmoothingEnabled = true; s.drawImage(src, 0, 0, w, h);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, w, h, 0, 0, w * c, h * c); ctx.restore();
    },
  };
}
