// The duotone-press joint: the next sheet is fed in. It slides across the press bed from the reading side with a soft shadow under
// its leading edge and stops on its marks; the old sheet stays put beneath it. Paper replaces paper, so the frame's brightness
// hardly moves.
export function create({ W, H, brand }) {
  const rtl = brand.dir !== 'ltr', E = (p) => { p = Math.min(1, Math.max(0, p)); return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; };
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const x = (rtl ? 1 : -1) * W * (1 - E(p));
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = rtl ? 12 : -12;
      ctx.fillStyle = '#000'; ctx.fillRect(x, 0, W, H); ctx.restore();
      ctx.drawImage(to, x, 0);
    },
  };
}
