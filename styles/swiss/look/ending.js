// The Swiss ending, the one exception of the system: an accent module sits on the grid, then leaves it in a straight, unsnapped line
// (with one short pause), grows, and the brand's logo is stamped into it. The name follows flush to the reading side, the handle in
// the mono face under a 1 px rule, the slogan in grey when the brand has one. spec: { duration }
import { need, span, lerp, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, E } = await import(look.base + 'motion.js');
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: SAFE.right - SAFE.left, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: 40, maxW: SAFE.right - SAFE.left, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW: SAFE.right - SAFE.left, single: true, where: 'the slogan' }) : null;
  const c0 = ground.cols[kit.rtl ? ground.cols.length - 1 : 0], m0 = ground.colW;
  const from = { x: c0[0], y: 330, s: m0 }, to = { x: kit.rtl ? SAFE.right - 330 : SAFE.left, y: 330, s: 330 };
  const yName = 330 + 330 + 70 + name.lead / 2, yRule = yName + name.lead / 2 + 10, yHandle = yRule + 26 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 20 + (slogan ? slogan.lead / 2 : 0), grey = mix(ground.paper, ground.ink, T.tone.grey);
  const rise = (t, t0, size) => (w, i, box, c) => { if (arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const sit = E(span(t, 0, 0.25));                                   // the module lands on its column
      const raw = span(t, 0.5, 1.25), fly = raw < 0.45 ? raw : raw < 0.6 ? 0.45 : (raw - 0.15) / 0.85;   // linear, with one pause
      const x = lerp(from.x, to.x, fly), y = lerp(from.y, to.y, fly), s = lerp(from.s, to.s, fly);
      if (sit > 0) {
        ctx.fillStyle = brand.colors.accent; ctx.fillRect(x, y, s, s * sit);
        const st = E(span(t, 1.25, 1.5));                                 // the logo is stamped in, top to bottom
        if (st > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s * st); ctx.clip(); brand.logo.draw(ctx, x + s * 0.16, y + s * 0.16, s * 0.68, ground.ink); ctx.restore(); }
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'start', color: ground.ink, each: rise(t, 1.5, name.size) });
      const rw = (SAFE.right - SAFE.left) * span(t, 1.7, 2.1);
      ctx.fillStyle = ground.ink; ctx.fillRect(kit.rtl ? SAFE.right - rw : SAFE.left, yRule, rw, 2);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'start', color: ground.ink, each: rise(t, 1.9, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'start', color: grey, each: rise(t, 2.1, slogan.size) });
    },
  };
}
