// The Bauhaus ending: the three primaries build the brand's emblem. An accent circle rolls in, an ink square drops onto it and turns
// its last quarter, a mid-tone triangle slides under; the logo is set into the square in paper colour. The name follows on a full ink
// slab, the handle in the mono face and the slogan in a soft ink tint below it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, circle, square, triangle, E } = await import(look.base + 'motion.js');
  const P = ground.P, dir = ground.dir, rtl = ground.rtl, sx = ground.sx;
  const pad = T.size.name * T.bar.pad, maxW = SAFE.right - SAFE.left - pad;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const sq = { x: W / 2 + dir * 70, y: 560, s: 270 }, ci = { x: W / 2 - dir * 110, y: 470, r: 170 };
  const yName = 860, yHandle = yName + name.lead / 2 + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  const x0 = rtl ? SAFE.left + pad : SAFE.left, x1 = rtl ? SAFE.right : SAFE.right - pad;
  const rise = (t, t0, size) => (w, i, box, c) => { if (arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size, dir) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      circle(ctx, span(t, 0, 0.7), ci.x, ci.y, ci.r, P.accent, { x: -dir * 900, y: 0 });
      triangle(ctx, span(t, 0.35, 1.0), sx(230), 640, 190, P.mid, { x: -dir * 700, y: 0 }, Math.PI / 2 * -dir);
      square(ctx, span(t, 0.25, 0.95), sq.x, sq.y, sq.s, P.ink, { x: 0, y: -900 });
      const st = E(span(t, 1.0, 1.3));
      if (st > 0) { ctx.save(); ctx.beginPath(); ctx.rect(sq.x - sq.s / 2, sq.y - sq.s / 2, sq.s * st, sq.s); ctx.clip(); brand.logo.draw(ctx, sq.x - sq.s * 0.34, sq.y - sq.s * 0.34, sq.s * 0.68, P.paper); ctx.restore(); }
      ground.slab(ctx, span(t, 1.2, 1.2 + T.dur.in), rtl ? x1 - name.width - pad : 0, rtl ? W : x0 + name.width + pad, yName, name.size * T.bar.h, P.ink);
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'start', color: P.paper, each: rise(t, 1.35, name.size) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'start', color: P.ink, each: rise(t, 1.7, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'start', color: P.soft, each: rise(t, 1.9, slogan.size) });
    },
  };
}
