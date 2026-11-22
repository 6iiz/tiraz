// The primary-geometry joint: the frame is the machine's grid of square cells. Cell by cell, on a diagonal from the reading side's
// top corner, a square of the next scene turns a quarter and grows to fill its cell, locking with the snap. The cut is made of the
// next scene's own pixels, so its brightness never jumps.
export function create({ W, H, brand, look }) {
  const c = look.tokens.cell, cols = Math.round(W / c), rows = Math.ceil(H / c), rtl = brand.dir !== 'ltr';
  const SNAP = (p) => 1 - (1 - Math.min(1, Math.max(0, p))) ** 5, n = cols + rows;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const k = (rtl ? cols - 1 - i : i) + j, q = SNAP((p - (k / n) * 0.55) / 0.45);
        if (q <= 0) continue;
        const x = i * c, y = j * c;
        if (q >= 1) { ctx.drawImage(to, x, y, c, c, x, y, c, c); continue; }
        ctx.save(); ctx.translate(x + c / 2, y + c / 2); ctx.rotate((rtl ? -1 : 1) * (1 - q) * Math.PI / 2); ctx.scale(q, q);
        ctx.drawImage(to, x, y, c, c, -c / 2, -c / 2, c, c); ctx.restore();
      }
    },
  };
}
