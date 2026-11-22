// The sumi ending: one large circle is brushed in a single breath; the brand's seal (the logo carved out of a square of the red) is
// pressed into its centre; the name blooms in the darkest ink below, the handle and the slogan follow in a middle tone. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 560, R = 215, S = 170;
  const ring = M.enso(cx, cy, R, { a0: rtl ? -0.7 * Math.PI : -0.3 * Math.PI, dir: rtl ? -1 : 1, w: 40, sweep: 0.9, seed: 77 });
  const yName = cy + R + 90 + name.lead / 2, yHandle = yName + name.lead / 2 + 20 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const bl = (t, t0, size) => (w, i, box, c) => M.bloom(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), 0, pal.ink, size);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.paint(ctx, ring, M.B(span(t, 0.1, 1.0)), pal.quiet(T.tone.nong));
      M.seal(ctx, cx, cy, S, pal, span(t, 1.1, 1.35), () => {
        if (t >= 1.1) { const s = S * 0.66; brand.logo.draw(ctx, -s / 2, -s / 2, s, pal.onSeal); }
      });
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: pal.ink, each: bl(t, 1.5, name.size) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: pal.grey, each: bl(t, 1.9, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: pal.grey, each: bl(t, 2.1, slogan.size) });
    },
  };
}
