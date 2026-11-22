// The midnight-stage ending, a curtain call: a follow-spot irises open on the brand's logo, standing alone in the light; the name
// comes down from the flies on a marquee board that sways and hangs while its bulbs chase; the handle and the slogan are lit on the
// wall below. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: maxW - 160, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.lead, weight: 500, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const L = 210, cx = W / 2, cy = 330 + L / 2;
  const bw = name.width + 150, bh = name.size * 1.3 + 44, by = cy + L / 2 + 70;
  const yHandle = by + bh + 60 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const bulb = M.bulbSprite(pal), sprite = M.pool(pal.light, 900, 0.15, 0.8), low = M.pool(pal.light, 800, 0.1, 0.7);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const r = M.IN(span(t, 0.05, 0.6));
      M.spot(ctx, sprite, cx, cy, (L * 0.95) * r, (L * 0.95) * r);
      if (r > 0) brand.logo.draw(ctx, cx - L / 2, cy - L / 2, L, M.lit(pal, Math.min(1, r * 1.3)));
      const ql = M.IN(span(t, 1.3, 1.7));
      M.spot(ctx, low, cx, (yHandle + ySlogan) / 2, 420 * ql, 150 * ql);
      const f = M.flown(t, 0.55, T.dur.fly, 0, by + bh + 80);
      if (f) {
        ctx.save(); ctx.translate(cx, M.PELMET); ctx.rotate(f.a); ctx.translate(-cx, -M.PELMET + f.dy);
        M.lines(ctx, pal, cx - bw / 2 + 40, cx - L / 2 - 30, by);
        M.lines(ctx, pal, cx + L / 2 + 30, cx + bw / 2 - 40, by);
        M.marquee(ctx, pal, bulb, cx - bw / 2, by, cx + bw / 2, by + bh, t + clock, span(t, 0.95, 0.95 + T.dur.marquee));
        kit.drawText(ctx, name, { x0, x1, y: by + bh / 2, align: 'center', color: pal.light, decor: Math.abs(f.dy) > 4 });
        ctx.restore();
      }
      if (ql > 0) {
        kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: pal.light, each: () => M.lit(pal, ql) });
        if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: pal.dim, each: () => M.lit(pal, M.IN(span(t, 1.5, 1.9)), pal.dim) });
      }
    },
  };
}
