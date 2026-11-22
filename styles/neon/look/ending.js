// The neon ending: the logo is the big sign. A light tube ring is mounted on the wall, the logo inside it ignites as a hot accent tube
// with its own bloom (built once from the logo), and its light floods the wall. Then the name lights as a light tube, the handle under
// it in the mono face, and the slogan dimmer still. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, L = SAFE.left, R = SAFE.right;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: R - L, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: 40, maxW: R - L, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW: R - L, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 480, ring = 170, ls = 180;
  const yName = cy + ring + 90 + name.lead / 2, yHandle = yName + name.lead / 2 + 10 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const tubes = { base: pal.white, key: pal.hot };
  const sName = M.sign(kit, name, { x0: L, x1: R, y: yName, align: 'center' }, tubes, pal, T);
  const sHandle = M.sign(kit, handle, { x0: L, x1: R, y: yHandle, align: 'center' }, tubes, pal, T);
  const sSlogan = slogan && M.sign(kit, slogan, { x0: L, x1: R, y: ySlogan, align: 'center' }, tubes, pal, T);
  const halo = M.shape(cx - ring, cy - ring, 2 * ring, 2 * ring, (c) => { c.beginPath(); c.arc(cx, cy, ring, 0, Math.PI * 2); c.stroke(); }, pal.white, pal, T, 5);
  const pad = 90, lx = cx - ls / 2, ly = cy - ls / 2;
  const logoGlow = M.bloom(ls + 2 * pad, ls + 2 * pad, (g) => brand.logo.draw(g, pad, pad, ls, pal.accent), pal.accent, 8, 30, T);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const bRing = M.flick(span(t, 0.1, 0.5), 2), bLogo = M.flick(span(t, 0.45, 0.95), 4);
      ground.spill(ctx, cx, cy, 1400, 1200, pal.accent, bLogo);
      ground.spill(ctx, cx, cy, 900, 900, pal.light, bRing * 0.3);
      halo.draw(ctx, bRing);
      if (bLogo > 0.02) { ctx.save(); ctx.globalAlpha = bLogo; ctx.drawImage(logoGlow, lx - pad, ly - pad); ctx.restore(); }
      brand.logo.draw(ctx, lx, ly, ls, M.mixLit(pal, pal.hot.core, bLogo));
      const word = (t0, seed, k = 1) => (i) => M.flick(span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.ignite), seed + i) * k;
      sName.draw(ctx, word(1.1, 30));
      sHandle.draw(ctx, word(1.5, 50, 0.9));
      if (sSlogan) sSlogan.draw(ctx, word(1.75, 70, 0.8));
    },
  };
}
