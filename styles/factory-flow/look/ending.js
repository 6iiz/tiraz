// The factory-flow ending: the last station is the loading bay. Its light comes on, a big crate rides in on the belt and stops in the
// middle, and the press comes down and stamps the brand's logo onto it. Then the name drops in on a big plaque hung from the bay, and
// the handle (mono) and the slogan ride in under it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 100;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const rx0 = SAFE.left - 6, rx1 = SAFE.right + 6, ry0 = 300, ry1 = 760, cx = W / 2, C = 250, cyC = ry1 - 50 - C / 2;
  const pl0 = ry1 + 70, pl1 = pl0 + name.lead + 40, yName = (pl0 + pl1) / 2;
  const yHandle = pl1 + 40 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const onCrate = P.on(P.crate), hitT = 1.05;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.room(ctx, rx0, ry0, rx1, ry1, P, span(t, 0, 0.2));
      const e = M.E(span(t, 0.1, 0.8)), x = rtl ? rx1 + C / 2 - (rx1 + C / 2 - cx) * e : rx0 - C / 2 + (cx - rx0 + C / 2) * e;
      M.belt(ctx, rx0 + 16, rx1 - 16, ry1 - 28, P, e * 700 * (rtl ? -1 : 1));
      ctx.save(); ctx.beginPath(); ctx.rect(rx0, ry0, rx1 - rx0, ry1 - ry0); ctx.clip();
      M.crate(ctx, x, cyC, C, P);
      if (t >= hitT) {
        const s = 1 + 0.1 * (1 - M.E(span(t, hitT, hitT + 0.2)));
        ctx.save(); ctx.translate(x, cyC); ctx.scale(s, s);
        M.shape(ctx, M.rectPath(-C * 0.36, -C * 0.36, C * 0.72, C * 0.72, 6), P.crate, P, 0, 0);
        brand.logo.draw(ctx, -C * 0.3, -C * 0.3, C * 0.6, onCrate); ctx.restore();
      }
      ctx.restore();
      M.press(ctx, cx, ry0, cyC - C / 2, C * 0.8, span(t, hitT - 0.25, hitT + 0.25), P);
      const drop = M.E(span(t, 1.3, 1.6));
      if (drop > 0) {
        ctx.save(); ctx.translate(0, (1 - drop) * -60);
        ctx.fillStyle = P.line; ctx.fillRect(SAFE.left + 80, ry1 + 10, 10, pl0 - ry1); ctx.fillRect(SAFE.right - 90, ry1 + 10, 10, pl0 - ry1);
        M.plaque(ctx, SAFE.left + 20, pl0, SAFE.right - 20, pl1, P);
        kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.onPlaque });
        ctx.restore();
      }
      const ride = (t0, size) => (w, i, box, c) => M.ride(c, span(t, t0 + i * 0.05, t0 + i * 0.05 + T.dur.in), box, size, rtl, T.dur.run, 0, W);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: P.light, each: ride(1.65, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.dim, each: ride(1.8, slogan.size) });
    },
  };
}
