// The shadow-beat ending: a second sun rises out of the horizon glow and stops high in the sky with the brand's logo in it as a black
// silhouette; the name, the handle and the slogan (on a black slab, in the sun's colour) snap in on the next beats, and the dancers
// end on one last pose, arms joined overhead, and hold it while the sun below keeps going down. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join('  '), { size: T.size.slogan, weight: 800, maxW: maxW - 60, single: true, where: 'the slogan' }) : null;
  const R = 175, cy = 500, yName = cy + R + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 12 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 44 + (slogan ? slogan.lead / 2 : 0);
  const b = T.beat, rise = (p) => 1 - (1 - p) ** 3, hold = 0.75 + b * 3;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, t >= hold ? { pose: ground.poseUp } : {});
      const p = rise(span(t, 0, 0.75)), y = T.horizon + R - (T.horizon + R - cy) * p;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, T.horizon); ctx.clip();
      ctx.fillStyle = pal.sun; ctx.beginPath(); ctx.arc(W / 2, y, R, 0, Math.PI * 2); ctx.fill();
      if (t >= 0.75) { const s = M.snap(t, 0.75, T.dur.snap); ctx.save(); ctx.translate(W / 2, cy); ctx.scale(s, s); brand.logo.draw(ctx, -R * 0.6, -R * 0.6, R * 1.2, pal.ink); ctx.restore(); }
      ctx.restore();
      const sN = M.snap(t, 0.75 + b, T.dur.snap);
      if (sN > 0) kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.ink });
      if (t >= 0.75 + b * 2) kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.ink });
      if (slogan && t >= 0.75 + b * 3) {
        const run = { x0: W / 2 - slogan.width / 2 - 24, x1: W / 2 + slogan.width / 2 + 24, y: ySlogan };
        M.slab(ctx, run, slogan, pal.ink, M.snap(t, 0.75 + b * 3, T.dur.snap));
        kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.sun });
      }
    },
  };
}
