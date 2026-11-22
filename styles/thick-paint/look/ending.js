// The thick-paint ending: the knife lays a square slab of the accent, the brand's logo is pressed into it (it lands with a short squash,
// as a stamp into wet paint, and keeps a lit and a dark edge); then the name is laid in raised paint by its own pass, the handle under a
// dragged rule of the accent, and the slogan in the muted paint. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: full - 40, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: full - 40, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: T.weight.lead, maxW: full - 40, single: true, where: 'the slogan' }) : null;
  const S = 330, sx = W / 2 - S / 2, sy = 330;
  const square = M.plane(S, S, P.accent, [P.paint, P.ground], 808, { row: 56 });
  const yName = sy + S + 80 + name.lead / 2, yRule = yName + name.lead / 2 + 6, yHandle = yRule + 40 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const rw = Math.min(full - 120, Math.max(handle.width + 120, 380)), rule = M.plane(rw, 22, P.accent, [P.paint, P.ground], 809, { row: 22, pad: 12 });
  const band = (yc, h) => ({ x: SAFE.left - 20, y: yc - h / 2, w: full + 40, h });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.knife(ctx, { x: sx, y: sy, w: S, h: S }, span(t, 0.05, 0.05 + T.dur.pass * 1.1), 0, rtl, () => M.drawPlane(ctx, square, sx, sy), P.lift(P.accent, 0.25));
      const st = span(t, 0.75, 0.95);
      if (st > 0) {                                                       // pressed in: lands a touch wide and short, then sets
        const sq = 1 - Math.sin(Math.min(1, st) * Math.PI) * 0.06, ls = S * 0.64, lx = W / 2 - ls / 2, ly = sy + S / 2 - ls / 2;
        ctx.save(); ctx.translate(W / 2, sy + S / 2); ctx.scale(2 - sq, sq); ctx.translate(-W / 2, -(sy + S / 2));
        brand.logo.draw(ctx, lx + 5, ly + 6, ls, P.shade(P.accent, 0.5));
        brand.logo.draw(ctx, lx - 2, ly - 2, ls, P.lift(P.onAccent, 0.3));
        brand.logo.draw(ctx, lx, ly, ls, P.onAccent);
        ctx.restore();
      }
      M.knife(ctx, band(yName, name.lead), span(t, 1.05, 1.05 + T.dur.pass), 0, rtl,
        () => M.relief(kit, ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.paint, surface: P.ground }), P.plane2);
      const rx = W / 2 - rw / 2;
      M.knife(ctx, { x: rx, y: yRule, w: rw, h: 22 }, span(t, 1.45, 1.75), 0, rtl, () => M.drawPlane(ctx, rule, rx, yRule), null);
      M.knife(ctx, band(yHandle, handle.lead), span(t, 1.6, 1.6 + T.dur.pass * 0.8), 0, rtl,
        () => M.relief(kit, ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.paint, surface: P.ground }), null);
      if (slogan) M.knife(ctx, band(ySlogan, slogan.lead), span(t, 1.9, 1.9 + T.dur.pass * 0.8), 0, rtl,
        () => M.relief(kit, ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.muted, surface: P.ground }), null);
    },
  };
}
