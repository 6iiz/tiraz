// Ending of agent-titles: the title is what everyone was after. A big disc of the hot ink is cut into the paper set, the logo
// is assembled inside it from four pieces that fly in along the diagonals and slap into place one after another, the brand's name slides
// in on a snipped ink strip, the handle on a small hot strip, the slogan on the ground; the agent walks in on the strip's edge and stops
// against the circle, the hero shot. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, which: 'paper', seed: 13 });
  const M = await import(look.base + 'motion.js'), I = ground.I, G = ground.color;
  const maxW = SAFE.right - SAFE.left, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: maxW - 100, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: maxW - 100, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW, single: true, where: 'the slogan' }) : null;
  const R = 250, cx = W / 2, cy = SAFE.top + R + 10, nh = name.size * 1.7, yName = cy + R + 50 + nh / 2;
  const hw = handle.width + 70, hh = handle.size * 1.9, yHandle = yName + nh / 2 + 30 + hh / 2, ySlogan = yHandle + hh / 2 + 30 + (slogan ? slogan.lead / 2 : 0);
  const disc = M.cut(M.ring(0, 0, R, 120), 200, 2.6), nameStrip = M.cut(M.strip(0, -nh / 2, maxW, nh, 24), 201), handleStrip = M.cut(M.strip(0, -hh / 2, hw, hh, 12), 202, 1.2);
  const L = R * 1.1, shards = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const dir = rtl ? 1 : -1;
      const pd = span(t, 0.05, 0.05 + T.dur.slide);
      if (pd > 0) { const k = M.slap(t - 0.05 - T.dur.slide), s = M.O(pd) * k; ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); M.piece(ctx, disc, I.hot, G); ctx.restore(); }
      // the logo in four pieces, each from its own diagonal
      shards.forEach(([sx, sy], i) => {
        const t0 = 0.3 + i * 0.14, p = span(t, t0, t0 + T.dur.slide); if (p <= 0) return;
        const off = (1 - M.O(p)) * 760, k = M.slap(t - t0 - T.dur.slide);
        ctx.save(); ctx.translate(cx + sx * off, cy + sy * off); ctx.scale(k, k);
        ctx.beginPath(); ctx.rect(sx < 0 ? -L / 2 - 2 : 0, sy < 0 ? -L / 2 - 2 : 0, L / 2 + 2, L / 2 + 2); ctx.clip();
        brand.logo.draw(ctx, -L / 2, -L / 2, L, I.on(I.hot));
        ctx.restore();
      });
      const pn = span(t, 1.0, 1.0 + T.dur.slide);
      if (pn > 0) {
        const dx = (1 - M.O(pn)) * dir * 1000, s = M.slap(t - 1.0 - T.dur.slide);
        ctx.save(); ctx.translate(SAFE.left + dx + maxW / 2, yName); ctx.scale(s, s); ctx.translate(-maxW / 2, 0); M.piece(ctx, nameStrip, I.ink, G);
        kit.drawText(ctx, name, { x0: 40, x1: maxW - 40, y: name.size * 0.04, align: 'center', color: I.on(I.ink) });
        ctx.restore();
      }
      const ph = span(t, 1.25, 1.25 + T.dur.slide);
      if (ph > 0) {
        const dx = (1 - M.O(ph)) * -dir * 1000, x0 = W / 2 - hw / 2 + dx;
        ctx.save(); ctx.translate(x0, yHandle); M.piece(ctx, handleStrip, I.hot, G); ctx.restore();
        kit.drawText(ctx, handle, { x0: x0 + 35, x1: x0 + hw - 35, y: yHandle, align: 'center', color: I.on(I.hot) });
      }
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: I.on(G), each: M.credit(t, (i) => 1.45 + i * T.dur.stagger, T.dur.slide, 0, rtl) });
      // the agent walks in from the far side along the top of the name strip and stops against the circle
      const stop = cx - dir * (R + 30), x0 = rtl ? -80 : W + 80, x = M.walkX(t, 1.1, x0, rtl ? 1 : -1), xx = rtl ? Math.min(stop, x) : Math.max(stop, x);
      if (t >= 1.1) M.agent(ctx, xx, yName - nh / 2 + 2, T.agent * 0.9, rtl ? 1 : -1, t, { fill: I.ink, scarf: I.hot, gap: G, walking: xx === x });
    },
  };
}
