// The orbit-intel ending: the descent goes on underneath; a caption plate opens and the reticle leaves a target on the ground and
// locks onto the brand's logo, which is set in the light colour inside it. The name settles under it, then a hairline, the handle in
// the mono face and the slogan in grey. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, P = T.plate;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const X0 = SAFE.left + 20, X1 = SAFE.right - 20, maxW = X1 - X0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' · '), { size: 46, weight: 500, maxW, minScale: 0.95, minPx: 44, where: 'the slogan' }) : null;
  const L = 220, lx = W / 2 - L / 2, ly = 360;
  const yName = ly + L + 60 + name.lead / 2, yRule = yName + name.lead / 2 + 6, yHandle = yRule + 24 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 12 + (slogan ? slogan.lead / 2 : 0);
  const py0 = ly - 70, py1 = (slogan ? ySlogan + slogan.height - slogan.lead / 2 : yHandle + handle.lead / 2) + 46;
  const g = ground.fromScreen(W * 0.66, 1180, clock);
  const c = (y) => ({ x0: X0, x1: X1, y, align: 'center' });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pp = M.plateP(t, 0, T.dur.open + 0.1, d + 1, 1);
      M.plate(ctx, pal, P.x0, py0, P.x1, py1, pp, kit.rtl);
      const lp = M.snap(span(t, 0.75, 1.05));
      if (lp > 0) { ctx.save(); ctx.beginPath(); ctx.rect(lx, ly + L * (1 - lp), L, L * lp); ctx.clip(); brand.logo.draw(ctx, lx, ly, L, pal.light); ctx.restore(); }
      M.lockOn(ctx, pal, { x0: lx + 10, x1: lx + L - 10, y: ly + L / 2 - 10 }, L * 1.1, ground.toScreen(g.x, g.y, t + clock), span(t, 0.3, 0.85), 0, 1);
      M.settle(kit, ctx, name, c(yName), t, 1.0, 0.06, T.dur.word, pal.light, pal.light);
      const rp = M.outC(span(t, 1.35, 1.75)), rw = 460 * rp; ctx.fillStyle = pal.key; ctx.fillRect(W / 2 - rw / 2, yRule, rw, 2);
      M.settle(kit, ctx, handle, c(yHandle), t, 1.55, 0.05, T.dur.word, pal.light, pal.light);
      if (slogan) M.settle(kit, ctx, slogan, c(ySlogan), t, 1.8, 0.05, T.dur.word, pal.grey, pal.grey);
    },
  };
}
