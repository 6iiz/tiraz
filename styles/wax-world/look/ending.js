// The wax world's ending: a big crayon cube of the accent drops out of the sky with the brand's logo drawn on its face, lands with
// a squash and throws its shadow on the floor; the name drops in under it as solid words, then the handle and the slogan as small
// quiet solids. The camera keeps swaying, stepped, to the last frame. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, C = M.sets(P);
  const maxW = SAFE.right - SAFE.left - 80, x0 = SAFE.left + 40, x1 = SAFE.right - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const sl = brand.slogan?.length ? brand.slogan.reduce((a, b) => a + (/[\p{P}]$/u.test(a) ? ' ' : '، ') + b) : null;
  const slogan = sl ? kit.fit(sl, { size: T.size.slogan, weight: 700, maxW, minScale: 0.7, where: 'the slogan' }) : null;
  const s = 250, cyTop = 330, cx = W / 2;
  const cube = M.solid(W, H, { w: s, h: s, D: 80, ...C.key, seed: 77,
    draw: (g, c) => { g.fillStyle = c; g.fillRect(0, 0, s, s); },
    decorate: (g) => brand.logo.draw(g, s * 0.18, s * 0.18, s * 0.64, P.night) });
  const yName = cyTop + s + 140 + name.lead / 2, yHandle = yName + name.lead / 2 + 36, ySlogan = yHandle + handle.lead / 2 + 20 + (slogan ? slogan.lead / 2 : 0);
  const N = M.solidText(kit, W, H, name, { x0, x1, y: yName, D: T.depth.name, colours: C, seed: 3 });
  const HD = M.solidText(kit, W, H, handle, { x0, x1, y: yHandle, D: T.depth.small, colours: { plain: C.dim, key: C.dim }, seed: 6 });
  const SL = slogan ? M.solidText(kit, W, H, slogan, { x0, x1, y: ySlogan, D: T.depth.small, colours: { plain: C.plain, key: C.key }, seed: 9 }) : [];
  const RN = M.rowsOf(N, name.size), RH = M.rowsOf(HD, handle.size), RS = slogan ? M.rowsOf(SL, slogan.size) : [];
  const sh = M.smudge(W, H, s * 1.5, P.shadow, 8);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = ground.step(t), dx = -ground.cam(t) * 0.3, pc = span(ts, 0.05, 0.55);
      if (pc > 0) { ctx.save(); ctx.globalAlpha = pc; ctx.drawImage(sh, cx - sh.width / 2 + dx * 1.6 - 50, ground.horizon + 60 - sh.height / 2); ctx.restore(); }
      M.place(ctx, cube, cx - s / 2 - cube.ox + dx, cyTop - cube.oy, M.drop(pc, 420), cyTop + s);
      M.words(ctx, kit, N, RN, ts, (k) => 0.7 + k * T.dur.gap, { dx, h: T.drop, dur: T.dur.drop });
      M.words(ctx, kit, HD, RH, ts, () => 1.25, { dx, h: 30, dur: 0.33 });
      if (slogan) M.words(ctx, kit, SL, RS, ts, (k) => 1.5 + k * 0.05, { dx, h: 30, dur: 0.33 });
    },
  };
}
