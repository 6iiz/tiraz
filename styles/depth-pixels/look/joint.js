// The Depth Pixels joint, a focus pull: the lens drifts out of focus on the old shot while the camera eases in a little, and the new
// shot comes up out of the blur and sharpens. Tonal: the two shots share the same dark model, so nothing flashes.
export function create({ W, H }) {
  const sm = (p) => p * p * (3 - 2 * p);
  return {
    draw(ctx, from, to, p) {
      const a = sm(Math.min(1, Math.max(0, (p - 0.3) / 0.4)));
      const blurOut = 16 * sm(Math.min(1, p / 0.55)), blurIn = 16 * sm(Math.min(1, (1 - p) / 0.55));
      ctx.save();
      const z = 1 + 0.035 * sm(p); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      if (a < 1) { ctx.filter = blurOut > 0.3 ? `blur(${blurOut.toFixed(1)}px)` : 'none'; ctx.drawImage(from, 0, 0); }
      ctx.restore();
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.filter = blurIn > 0.3 ? `blur(${blurIn.toFixed(1)}px)` : 'none'; ctx.drawImage(to, 0, 0); ctx.restore(); }
    },
  };
}
