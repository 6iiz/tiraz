// The Blob World joint: the next board is slid onto the table over the old one, from the reading side, with a soft shadow along its
// leading edge; the old board gives way a little in the same direction. Paper over paper: the frame's brightness barely moves.
export async function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', io = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  return {
    draw(ctx, from, to, p) {
      const q = io(Math.min(1, Math.max(0, p))), s = rtl ? -1 : 1;           // RTL: the new board comes in from the right, moving left
      const xn = -s * W * (1 - q), xo = s * W * 0.3 * q;
      ctx.drawImage(from, xo, 0);
      const edge = rtl ? xn : xn + W, g = ctx.createLinearGradient(edge, 0, edge + s * -1 * -40, 0);
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.filter = 'blur(14px)';
      ctx.fillRect(rtl ? xn - 26 : xn + 6, 30, W + 20, H - 60); ctx.restore();
      ctx.drawImage(to, xn, 0);
    },
  };
}
