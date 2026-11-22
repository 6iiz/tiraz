// The terrain-story ending: the camera keeps pushing over the island; a pillar of light rises from the land below and a ring of it
// spreads over the terrain, while the brand's logo comes down out of the sky onto its place above, in the dark colour. The name
// follows, then a hairline in the route colour, the handle in the mono face and the slogan in grey. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const X0 = SAFE.left + 10, X1 = SAFE.right - 10, maxW = X1 - X0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' · '), { size: 46, weight: 500, maxW, minScale: 0.95, minPx: 44, where: 'the slogan' }) : null;
  const L = 220, lx = W / 2 - L / 2, ly = 320;
  const yName = ly + L + 60 + name.lead / 2, yRule = yName + name.lead / 2 + 6, yHandle = yRule + 24 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 12 + (slogan ? slogan.lead / 2 : 0);
  const site = ground.pick(W / 2, 1240, clock);
  const c = (y) => ({ x0: X0, x1: X1, y, align: 'center' });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, b = ground.at(site.u, site.v, 0, time);
      const rp = span(t, 0.5, 1.6);
      if (rp > 0 && rp < 1) { ctx.save(); ctx.globalAlpha = 1 - rp; ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(b.x, b.y, 30 + 420 * M.outC(rp), (30 + 420 * M.outC(rp)) * 0.32, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }
      M.pillar(ctx, pal, b, 150 * M.outC(span(t, 0.1, 0.6)), 1);
      const lp = span(t, 0.2, 0.75);
      if (lp > 0) { const e = M.settleE(lp); ctx.save(); ctx.globalAlpha = Math.min(1, lp / 0.3); ctx.translate(W / 2, ly + L / 2 - 60 * (1 - e)); ctx.scale(1 + 0.08 * (1 - e), 1 + 0.08 * (1 - e)); brand.logo.draw(ctx, -L / 2, -L / 2, L, pal.dark); ctx.restore(); }
      kit.drawText(ctx, name, { ...c(yName), color: pal.dark, key: pal.dark, each: M.drop(t, 0.8, 0.06, T.dur.word, 0, name.size) });
      const rw = 440 * M.outC(span(t, 1.2, 1.6)); ctx.fillStyle = pal.line; ctx.fillRect(W / 2 - rw / 2, yRule, rw, 2);
      kit.drawText(ctx, handle, { ...c(yHandle), color: pal.dark, each: M.drop(t, 1.4, 0.05, T.dur.word, 0, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { ...c(ySlogan), color: pal.grey, each: M.drop(t, 1.65, 0.05, T.dur.word, 0, slogan.size) });
    },
  };
}
