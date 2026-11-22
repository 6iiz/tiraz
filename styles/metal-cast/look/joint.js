// The metal-cast joint: the table moves on. The finished frame slides up and away and the next stretch of the same table comes up
// from below, as if the camera were carried along it; both halves are the same dark table, so the seam falls in its shadowed edge
// and the brightness never jumps. One eased move, no fade.
export function create({ W, H }) {
  const E = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  return {
    draw(ctx, from, to, p) {
      const y = Math.round(H * E(Math.min(1, Math.max(0, p))));
      ctx.drawImage(from, 0, -y);
      ctx.drawImage(to, 0, H - y);
    },
  };
}
