// The Quest Pixels joint, a mosaic: the old screen breaks into ever bigger game pixels (12, 24, 48, 96 px) in four hard steps, the
// new screen arrives at the coarsest size and sharpens back in four steps. The colours stay where they were, so nothing flashes.
export function create({ W, H }) {
  const sizes = [12, 24, 48, 96];
  const small = sizes.map((b) => { const c = document.createElement('canvas'); c.width = Math.ceil(W / b); c.height = Math.ceil(H / b); return c; });
  const coarse = (ctx, src, k) => {
    const c = small[k], g = c.getContext('2d'); g.imageSmoothingEnabled = true;
    g.drawImage(src, 0, 0, c.width, c.height);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, c.width, c.height, 0, 0, c.width * sizes[k], c.height * sizes[k]); ctx.restore();
  };
  return {
    draw(ctx, from, to, p) {
      if (p <= 0) { ctx.drawImage(from, 0, 0); return; }
      if (p >= 1) { ctx.drawImage(to, 0, 0); return; }
      if (p < 0.5) coarse(ctx, from, Math.min(3, Math.floor(p * 8)));
      else coarse(ctx, to, Math.min(3, Math.floor((1 - p) * 8)));
    },
  };
}
