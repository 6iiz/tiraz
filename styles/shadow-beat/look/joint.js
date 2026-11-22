// The shadow-beat joint: a whip pan. The old frame is thrown out sideways and the new one swings in behind it, with a true directional
// smear (several faint copies along the motion, strongest at full speed). Both frames share the same sunset, so only the shapes move.
export function create({ W, H, brand }) {
  const dir = brand.dir !== 'ltr' ? 1 : -1, n = 6;
  const pos = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);          // in-out: fastest in the middle
  return {
    draw(ctx, from, to, p) {
      const x = pos(p) * W * dir, speed = Math.sin(Math.PI * p);
      ctx.drawImage(from, x, 0); ctx.drawImage(to, x - W * dir, 0);
      if (speed > 0.05) {
        ctx.save(); ctx.globalAlpha = 0.18 * speed;
        for (let i = 1; i <= n; i++) { const o = -dir * i * 26 * speed; ctx.drawImage(from, x + o, 0); ctx.drawImage(to, x - W * dir + o, 0); }
        ctx.restore();
      }
    },
  };
}
