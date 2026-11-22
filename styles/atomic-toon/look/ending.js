// The atomic-toon ending: the brand as an atomic emblem. A round of the accent pops on with the logo printed in it, three orbits are
// drawn round it in broken ink with a small paper electron on each that steps along on twos, sparkles pop around, then the name, the
// handle in a paper pill and the slogan pop on below. spec: { duration }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, room: 2 });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: X1 - X0 - 40, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: X1 - X0 - 160, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW: X1 - X0 - 40, minScale: 0.9, where: 'the slogan' }) : null;
  const R = 120, cy = 300 + 170, yName = cy + 320 + name.lead / 2;
  const hw = handle.width + 80, hh = handle.lead + 18, hy = yName + name.lead / 2 + 16, ySlogan = hy + hh + 34 + (slogan ? slogan.lead / 2 : 0);
  const disc = M.circle(W / 2, cy, R), pill = M.round(W / 2 - hw / 2, hy, hw, hh, hh / 2);
  const orbits = [0, 60, 120].map((deg) => { const p = new Path2D(), m = new DOMMatrix().translate(W / 2, cy).rotate(deg); p.addPath((() => { const e = new Path2D(); e.ellipse(0, 0, 330, 105, 0, 0, Math.PI * 2); return e; })(), m); return { p, deg }; });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      orbits.forEach((o, i) => {
        const q = span(t, 0.35 + i * 0.12, 0.6 + i * 0.12);
        if (q <= 0) return;
        ctx.save(); ctx.globalAlpha = Math.ceil(q * 3) / 3;
        M.cel(ctx, o.p, { line: P.ink, width: 4, id: 130 + i, t, gaps: 0.22 }); ctx.restore();
        const a = (M.twos(t) * 0.22 + i * 2.1) * (rtl ? -1 : 1), th = (o.deg * Math.PI) / 180;
        const ex = Math.cos(a) * 330, ey = Math.sin(a) * 105;
        M.cel(ctx, M.circle(W / 2 + ex * Math.cos(th) - ey * Math.sin(th), cy + ex * Math.sin(th) + ey * Math.cos(th), 16), { fill: i === 1 ? P.accent : P.paper, line: P.ink, width: 3, id: 140 + i, t, gaps: 0 });
      });
      ctx.save();
      if (M.grow(ctx, M.pop(t, 0.1, 0.4), W / 2, cy) !== false) {
        M.cel(ctx, disc, { fill: P.accent, line: P.ink, width: 6, id: 150, t, gaps: 0.12 });
        brand.logo.draw(ctx, W / 2 - R * 0.62, cy - R * 0.62, R * 1.24, P.onAccent);
      }
      ctx.restore();
      [[W / 2 + 330, cy - 150, 34], [W / 2 - 360, cy + 120, 24]].forEach(([x, y, r], j) => {
        const s = M.pop(t, 0.8 + j * 0.15, 0.3); if (s > 0) M.cel(ctx, M.sparkle(x, y, r * s), { fill: j ? P.accent : P.paper, line: P.ink, width: 3, id: 160 + j, t, gaps: 0 });
      });
      ctx.save();
      if (M.grow(ctx, M.pop(t, 0.9, T.dur.pop), W / 2, yName) !== false) kit.drawText(ctx, name, { x0: X0, x1: X1, y: yName, align: 'center', color: P.ink });
      ctx.restore();
      ctx.save();
      if (M.grow(ctx, M.pop(t, 1.25, T.dur.pop), W / 2, hy + hh / 2) !== false) {
        M.cel(ctx, pill, { fill: P.paper, line: P.ink, width: 4, id: 170, t, gaps: 0.16 });
        kit.drawText(ctx, handle, { x0: W / 2 - hw / 2, x1: W / 2 + hw / 2, y: hy + hh / 2, align: 'center', color: P.ink });
      }
      ctx.restore();
      if (slogan) kit.drawText(ctx, slogan, { x0: X0, x1: X1, y: ySlogan, align: 'center', color: P.ink,
        each: (w, i, b, c) => M.grow(c, M.pop(t, 1.5 + i * 0.08, T.dur.pop), b.x + b.width / 2, b.y) });
    },
  };
}
