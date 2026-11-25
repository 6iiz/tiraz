// The cube-build ending: the brand's logo is built from key-colour cubes that drop in from above the camera, the bottom course
// first, like a wall going up; then the name is thrown in cube by cube under it and snaps. A short rule, the handle (mono) and the
// slogan are set flat below. Nothing leaves: the finished logo holds, with the slow ripple running through it.
// spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 5 });
  const { builder, rec } = await import(look.base + 'cubes.js');
  const { out3 } = await import(look.base + 'motion.js');
  const P = W3.P, maxW = SAFE.right - SAFE.left - 40, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 500, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const LS = T.size.logo, gap1 = 70, gap2 = 44;
  const total = LS + gap1 + name.size * 1.2 + gap2 + handle.lead + (slogan ? slogan.height + 10 : 0), top = kit.place(total, 700);
  const yLogo = top + LS / 2, yName = top + LS + gap1 + name.size * 0.6, yRule = yName + name.size * 0.6 + gap2 * 0.45;
  const yHandle = yRule + gap2 * 0.55 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const logo = W3.logoVoxels(LS, W / 2, yLogo, Math.max(9, LS / 22));
  logo.cells.forEach((c) => { c.u = 1 - c.u; c.key = false; });
  const nm = await W3.voxels(name, { y: yName, align: 'center' });
  const pool = W3.pool(logo.cells.length + nm.cells.length);
  const BL = builder(W3, logo, { pool, t0: 0.1, window: 0.55, dur: 0.38, color: () => P.key, fly: { side: 140, spread: 220, z: 650, arc: 60 }, seed: 5 });
  const BN = builder(W3, nm, { pool, base: logo.cells.length, t0: 0.95, window: 0.34, seed: 6 });
  const ruleW = Math.max(handle.width, 160) + 40;
  return {
    duration: d,
    draw(ctx, t) {
      BL.at(t); const st = BN.at(t); pool.commit();
      W3.draw(ctx, t);
      rec(W3, kit, nm, st);
      const rq = out3(span(t, 1.45, 1.8));
      if (rq > 0) { ctx.fillStyle = P.key; const w = ruleW * rq; ctx.fillRect(W / 2 - w / 2, yRule - 2, w, 4); }
      const ph = out3(span(t, 1.6, 1.9)), ps = out3(span(t, 1.8, 2.1));
      W3.flat(ctx, handle, { y: yHandle, color: P.ink, dy: (1 - ph) * 22, alpha: Math.min(1, ph * 3) });
      if (slogan) W3.flat(ctx, slogan, { y: ySlogan, color: P.lead, dy: (1 - ps) * 22, alpha: Math.min(1, ps * 3) });
    },
  };
}
