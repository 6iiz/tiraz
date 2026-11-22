// The pop ending: one big bang. An accent starburst explodes in the upper half with action lines, the brand's logo pops into its
// middle, then the name lands in a tilted panel, the handle in an accent caption box, and the slogan in a soft ink tint under it.
// spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, zoom, panel, burstPath, burst, action, pop, E } = await import(look.base + 'motion.js');
  const P = ground.P, padX = 50, maxW = SAFE.right - SAFE.left - 2 * padX;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.line, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 500, path = burstPath(cx, cy, 150, 150, 95, 18, 0.05);
  const nW = name.width + 2 * padX, nH = name.lead + 20, nX = cx - nW / 2, nY = 790;
  const hW = handle.width + 50, hH = handle.lead + 10, hX = cx - hW / 2, hY = nY + nH + 36;
  const ySlogan = hY + hH + 30 + (slogan ? slogan.lead / 2 : 0);
  const pops = (t, t0, size) => (w, i, bx, c) => { const s0 = t0 + i * T.dur.step; if (arrive(c, span(t, s0, s0 + T.dur.in), bx, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      action(ctx, cx, cy, 300, 420, 26, P, E(span(t, 0.05, 0.45)));
      ctx.save();
      if (zoom(ctx, span(t, 0, 0.45), 0, cx, cy, 0.05) !== false) burst(ctx, path, P.accent, P, T);
      ctx.restore();
      const lp = span(t, 0.55, 0.9);
      if (lp > 0) { const s = Math.max(0.001, pop(lp)) * 190; ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - E(lp)) * 0.4); brand.logo.draw(ctx, -s / 2, -s / 2, s, P.on); ctx.restore(); }
      ctx.save();
      if (zoom(ctx, span(t, 1.0, 1.0 + T.dur.panel), 0, cx, nY + nH / 2, -0.025) !== false) {
        panel(ctx, nX, nY, nW, nH, P.paper, P, T);
        kit.drawText(ctx, name, { x0: nX, x1: nX + nW, y: nY + nH / 2, color: P.ink, each: pops(t, 1.1, name.size) });
      }
      ctx.restore();
      ctx.save();
      if (zoom(ctx, span(t, 1.45, 1.45 + T.dur.panel), 0, cx, hY + hH / 2, 0.03) !== false) {
        panel(ctx, hX, hY, hW, hH, P.accent, P, { ink: { line: T.ink.line * 0.7, shadow: T.ink.shadow * 0.6 } });
        kit.drawText(ctx, handle, { x0: hX, x1: hX + hW, y: hY + hH / 2, color: P.on });
      }
      ctx.restore();
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.ink, each: pops(t, 1.8, slogan.size) });
    },
  };
}
