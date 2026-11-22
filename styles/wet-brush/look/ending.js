// The wet brush ending: a large pool of the pigment blooms out from the centre of the page, the logo develops on it, then the name is
// painted underneath on a pale band and develops as the brush passes; the handle and slogan follow, and drops are flicked round the pool.
// spec: { duration }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 560, R = 210, pool = M.bloomSprite(R, pal.accent, 0.7, 101), logoInk = pal.on(pal.tint(0.62));
  const yName = cy + R + 100 + name.lead / 2, yHandle = yName + name.lead / 2 + 24 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const nw = name.width + name.size * 0.8, nx = (W - name.width) / 2 - name.size * 0.4, nB = M.band(nw, name.size * 1.4, pal.accent, T.tone.band, 103, rtl);
  const nb = M.boxes(name, { x0: SAFE.left, x1: SAFE.right, y: yName, rtl }), nT = nb.map((b) => M.passTime(b, nx, nx + nw, 1.3, 1.3 + T.dur.pass, rtl));
  const D = M.drops(107, 16, cx, cy, R * 1.5), grey = pal.quiet(T.tone.grey);
  const dev = (t, t0, color) => (w, i, box, c) => M.develop(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.dry), 0, pal.wet, color);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pb = M.E(span(t, 0.1, 0.9));
      if (pb > 0) { const sz = pool.cv.width * (0.3 + 0.7 * pb); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = Math.min(1, pb * 2); ctx.drawImage(pool.cv, cx - sz / 2, cy - sz / 2, sz, sz); ctx.restore(); }
      M.splash(ctx, D, span(t, 0.85, 1.2), pal.accent);
      const q = span(t, 0.8, 1.3);
      if (q > 0) { const s = R * 1.05; ctx.save(); ctx.globalAlpha = Math.min(1, q * 2.5); brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, mix(pal.wet, logoInk, M.E(q))); ctx.restore(); }
      M.lay(ctx, nB, nx, yName, M.BR(span(t, 1.3, 1.3 + T.dur.pass)), rtl);
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: pal.ink, each: (w, i, box, c) => M.develop(c, span(t, nT[i], nT[i] + T.dur.dry), 0, pal.wet, pal.ink) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: grey, each: dev(t, 2.0, grey) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: grey, each: dev(t, 2.2, grey) });
    },
  };
}
