// The Heat Vision ending: the brand's logo appears as a heat signature. A warm body blooms in the picture, the logo warms up out of it
// from a soft smear to its hottest, sharpest form, and the hot-spot tracker closes on it. The name warms in under it inside a measuring box,
// then the handle in the mono face and the slogan. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW, minPx: T.minPx, where: 'the slogan' }) : null;
  const S = 280, lx = W / 2 - S / 2, ly = 330;
  const top = ly + S + 80, hBox = name.height + 16 + handle.height + (slogan ? slogan.height + 10 : 0) + T.pad * 2;
  const yName = top + T.pad + name.lead / 2, yHandle = yName - name.lead / 2 + name.height + 16 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const logoRun = { x: lx + S * 0.08, w: S * 0.84, y: ly + S / 2, size: S * 0.86 };
  const warmText = (t, t0, top) => (w, i, b, c) => M.warm(c, M.heat(t, t0 + i * T.dur.stagger, T.dur.rise), pal, top);
  return {
    duration: d,
    draw(ctx, t) {
      const bloom = M.outC(span(t, 0, 0.6)), k = M.heat(t, 0.25, 0.7);
      ground.draw(ctx, t, [{ x: W / 2, y: ly + S / 2, r: 200 + 260 * bloom, k: 0.55 * bloom }]);
      if (k > 0) {                                                       // the logo: soft and mid-ramp, then hot and sharp
        ctx.save(); ctx.globalAlpha = Math.min(1, k * 2.5);
        if (k < 1) ctx.filter = `blur(${((1 - k) * 18).toFixed(1)}px)`;
        ctx.shadowColor = pal.accent; ctx.shadowBlur = 40 * k;
        brand.logo.draw(ctx, lx, ly, S, k < 1 ? pal.css(0.4 + 0.6 * k) : pal.hot);
        ctx.restore();
      }
      M.tracker(ctx, pal, logoRun, M.heat(t, 0.85, 0.35), rtl);
      M.areaBox(ctx, pal, SAFE.left, top, SAFE.right - SAFE.left, hBox, span(t, 1.0, 1.25), 'ID', mono);
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: pal.hot, each: warmText(t, 1.1, pal.hot) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: pal.dim, each: warmText(t, 1.6, pal.dim) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: pal.dim, each: warmText(t, 1.9, pal.css(0.82)) });
    },
  };
}
