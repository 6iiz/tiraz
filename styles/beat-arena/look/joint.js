// The beat-arena joint: the next set slides in on diagonal stripes, like a stage flat wheeled across. Each stripe of the incoming
// scene runs in along the diagonal a moment after its neighbour, from the reading side. Both scenes share the accent stage colour,
// so the change is a change of pattern, not of brightness.
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', n = 9, ang = -0.5, L = Math.hypot(W, H), bw = (L * 1.2) / n;
  const ease = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - (1 - p) ** 3);
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.rotate(ang); ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const k = rtl ? n - 1 - i : i, q = ease(p * 1.7 - i * (0.7 / n));
        if (q <= 0) continue;
        const x = -L * 0.6 + k * bw, len = L * 1.2 * q;
        ctx.rect(x, i % 2 ? L * 0.6 - len : -L * 0.6, bw + 1, len);      // alternate stripes come from opposite ends
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clip();
      ctx.drawImage(to, 0, 0);
      ctx.restore();
    },
  };
}
