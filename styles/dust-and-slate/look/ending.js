// The slate's ending: the brand's logo is drawn in white chalk (uncovered from the top as a hand fills it in), a ring is thrown round it
// with the accent stick, the name is written large under it and underlined, then the handle (mono, written left to right) and the
// slogan in the dimmer chalk. Everything is written, nothing fades. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the slogan' }) : null;
  const S = 240, cx = W / 2, cy = 500, yName = cy + S / 2 + 150, yU = yName + name.size * 0.66;
  const yHandle = yU + 60 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const loop = M.ring(601, cx, cy, S * 0.78, S * 0.74, -2.2, 1.08, 0.04);
  const under = kit.rtl ? M.stroke(602, cx + name.width / 2 + 20, yU, cx - name.width / 2 - 20, yU + 4, 6) : M.stroke(602, cx - name.width / 2 - 20, yU, cx + name.width / 2 + 20, yU + 4, 6);
  const sName = M.schedule(name, 1.0, 1.55, 0.06), sHandle = M.schedule(handle, 1.9, 2.3, 0.04), sSlogan = slogan ? M.schedule(slogan, 2.2, 2.7, 0.05) : [];
  const writer = (t, sched, size) => (w, i, box, c) => { if (M.write(c, span(t, sched[i].s, sched[i].e), box, size, w.arabic) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const white = M.chalk(ctx, P.chalk), dim = M.chalk(ctx, P.dim, 13), acc = M.chalk(ctx, P.accent, 17);
      const pl = span(t, 0.1, 0.6);                                      // the logo is filled in from the top down
      if (pl > 0) { ctx.save(); ctx.beginPath(); ctx.rect(cx - S, cy - S / 2 - 10, S * 2, (S + 20) * pl + 2); ctx.clip(); brand.logo.draw(ctx, cx - S / 2, cy - S / 2, S, white); ctx.restore(); }
      M.trace(ctx, loop, span(t, 0.6, 0.95), T.chalk.line + 1, acc);
      kit.drawText(ctx, name, { x0, x1, y: yName, color: white, key: white, each: writer(t, sName, name.size) });
      M.trace(ctx, under, span(t, 1.6, 1.85), T.chalk.line, acc);
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: dim, key: dim, each: writer(t, sHandle, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: dim, key: dim, each: writer(t, sSlogan, slogan.size) });
    },
  };
}
