// The sitcom's ending: a portal swirls open above the duo, and the brand's logo comes tumbling out of it on a light disc that lands
// with a squish where the portal was (the portal closes behind it). The name drops onto a light plate under it, the handle is typed on
// a terminal tag, the slogan follows in grey. The tall one waves; the blob does its happiest take. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, C = T.cast;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 50, x1 = SAFE.right - 50, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: x1 - x0, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0 - 60, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW: x1 - x0, minScale: 0.9, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 500, R = 170;
  const py0 = cy + R + 70, yName = py0 + 40 + name.lead / 2, ySlogan = yName + name.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  const py1 = (slogan ? ySlogan + slogan.height - slogan.lead / 2 : yName + name.lead / 2) + 40;
  const hy0 = py1 + 34, hy1 = hy0 + handle.lead + 24;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = ground.k(t), tt = t + clock;
      M.duo(ctx, P, C, tt, k, { wave: span(t, 1.4, 1.7), look: [0.3, -0.9] }, { take: span(t, 1.0, 1.2), look: [-0.3, -0.9] });
      const pr = R * 1.15 * M.ease.outBack(span(t, 0, 0.4)) * (1 - M.ease.outCubic(span(t, 1.0, 1.35)));
      M.portal(ctx, P, cx, cy, pr, tt, k);
      const pl = span(t, 0.55, 1.05);
      if (pl > 0) {
        const e = M.ease.outBack(pl), land = span(t, 1.05, 1.25), sq = land > 0 && land < 1 ? 1 - 0.1 * Math.sin(Math.PI * land) : 1;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - Math.min(1, e)) * 3); ctx.scale(e * (2 - sq), e * sq);
        M.shape(ctx, P, M.ellipse(0, 0, R, R), k, { fill: P.paper, shadow: P.shade, seed: 210, sx: -16, sy: -16 });
        const s = R * 1.2; brand.logo.draw(ctx, -s / 2, -s / 2, s, P.dark);
        ctx.restore();
      }
      const pp = span(t, 1.2, 1.45); if (pp <= 0) return;
      const fall = (1 - M.ease.outCubic(pp)) * -80;
      ctx.save(); ctx.translate(0, fall);
      M.shape(ctx, P, M.box(SAFE.left, py0, SAFE.right, py1, 36), k, { fill: P.paper, shadow: P.shade, seed: 211, sx: -12, sy: -12 });
      kit.drawText(ctx, name, { x0, x1, y: yName, color: P.dark, key: P.dark });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: P.note, key: P.note, each: () => { if (t < 1.9) return false; } });
      ctx.restore();
      if (t >= 1.5) {
        const hw = handle.width + 80;
        M.tag(ctx, P, k, cx - hw / 2, hy0, cx + hw / 2, hy1, span(t, 1.5, 1.7));
        kit.drawText(ctx, handle, { x0: cx - hw / 2, x1: cx + hw / 2, y: (hy0 + hy1) / 2, color: P.light, key: P.light, each: () => { if (t < 1.65) return false; } });
      }
    },
  };
}
