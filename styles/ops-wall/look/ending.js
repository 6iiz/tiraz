// The ops-wall ending, the one pull-back: the camera, close on the wall, draws back to show the whole briefing. A card carrying the
// logo is pinned by two magnets and looped in the accent marker; then the name is written under it in graphite, the handle sits on
// a small card with a magnet, the slogan is written in a soft graphite. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: maxW - 120, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const S = 300, lx = W / 2 - S / 2, ly = 360, yName = ly + S + 160, hh = handle.lead + 26, hw = handle.width + 110;
  const yHandle = yName + name.lead / 2 + 26, ySlogan = yHandle + hh + 40 + (slogan ? slogan.lead / 2 : 0);
  const ring = M.loop(W / 2, ly + S / 2, S * 0.74, S * 0.6, 404, -1.2);
  const nt = M.writeTimes(name, 1.2, T.write.speed * 0.8), st = slogan ? M.writeTimes(slogan, nt.end + 0.45, T.write.speed) : null;
  return {
    duration: d,
    draw(ctx, t) {
      // the pull-back: one eased move from close to the whole wall
      const z = 1 + 0.32 * (1 - M.E(span(t, 0, 1.3)) ** 1);
      ctx.save(); ctx.translate(W / 2, ly + S / 2); ctx.scale(z, z); ctx.translate(-W / 2, -(ly + S / 2));
      ground.draw(ctx, t);
      M.card(ctx, lx, ly, S, S, P, span(t, 0.1, 0.5), 0, rtl ? 0.02 : -0.02, () => {
        brand.logo.draw(ctx, lx + S * 0.18, ly + S * 0.18, S * 0.64, P.ink);
        M.magnet(ctx, lx + 30, ly + 22, 17, P.ink, span(t, 0.4, 0.55)); M.magnet(ctx, lx + S - 30, ly + 22, 17, P.measure, span(t, 0.5, 0.65));
      });
      M.stroke(ctx, ring, span(t, 0.7, 1.25), 8, P.accent);
      ctx.restore();
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.ink, each: (w, i, box, cc) => M.write(cc, t, nt[i], box, name.size, rtl, P.ink, 600 + i) });
      const hx = W / 2 - hw / 2;
      M.card(ctx, hx, yHandle, hw, hh, P, span(t, nt.end, nt.end + 0.35), 0, rtl ? -0.01 : 0.01, () => {
        kit.drawText(ctx, handle, { x0: hx + 40, x1: hx + hw - 20, y: yHandle + hh / 2, color: P.ink });
        M.magnet(ctx, hx + 22, yHandle + hh / 2, 11, P.accent, span(t, nt.end + 0.25, nt.end + 0.4));
      });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.soft, each: (w, i, box, cc) => M.write(cc, t, st[i], box, slogan.size, rtl, P.soft, 700 + i) });
    },
  };
}
