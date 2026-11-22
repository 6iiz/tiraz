// The Rapid Play ending, the win screen: the sunburst spins up, every stage pip is lit, confetti bursts out of the middle and falls,
// the brand's logo springs onto a round badge with a hard shadow, the name slams in on a tilted banner card, and the handle and the
// slogan follow on a dark tag and a light card. spec: { duration }
import { need, span, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: 760, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: 44, maxW: 700, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 700, maxW: 760, minPx: 44, where: 'the slogan' }) : null;
  const bR = 150, by = SAFE.top + 30 + bR, cx = W / 2;
  const nw = name.width + 130, nh = name.height + 30, ny = by + bR + 70;
  const hw = handle.width + 70, hh = handle.height + 10, hy = ny + nh + 40;
  const sw = slogan ? slogan.width + 80 : 0, sh = slogan ? slogan.height + 20 : 0, sy = hy + hh + 34;
  const r = rng(2024), bits = Array.from({ length: 60 }, () => ({ a: r() * Math.PI * 2, v: 500 + r() * 900, s: 12 + r() * 16, k: r() < 0.5 ? 'a' : 'l', spin: (r() - 0.5) * 12, sq: r() < 0.5 }));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { pips: 8, spin: 2.2 });
      for (const b of bits) { const f = t - 0.25; if (f < 0 || f > 3) continue;          // confetti: thrown out, then falling
        const x = cx + Math.cos(b.a) * b.v * f * 0.7, y = by + Math.sin(b.a) * b.v * f * 0.7 + 700 * f * f;
        if (y > H + 40) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(b.spin * f);
        ctx.fillStyle = b.k === 'a' ? P.a : P.l; ctx.strokeStyle = P.d; ctx.lineWidth = 4;
        ctx.beginPath(); b.sq ? ctx.rect(-b.s / 2, -b.s / 4, b.s, b.s / 2) : ctx.arc(0, 0, b.s / 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
      const q = M.back(span(t, 0.05, 0.4));
      if (q > 0) { ctx.save(); ctx.translate(cx, by); ctx.scale(q, q); ctx.rotate((1 - Math.min(1, q)) * 0.6); ctx.translate(-cx, -by);
        M.toon(ctx, M.star(cx, by, bR * 1.02, bR * 1.22, 18, t * 0.5), P.a, P, 0, 7);
        M.toon(ctx, (c) => c.arc(cx, by, bR * 0.9, 0, Math.PI * 2), P.l, P, 14, 9);
        brand.logo.draw(ctx, cx - bR * 0.55, by - bR * 0.55, bR * 1.1, P.d); ctx.restore(); }
      const s = M.slam(span(t, 0.55, 0.77));
      if (s > 0) { ctx.save(); ctx.translate(cx, ny + nh / 2); ctx.rotate(-0.04); ctx.scale(s, s); ctx.translate(-cx, -(ny + nh / 2));
        M.toon(ctx, M.rect(cx - nw / 2, ny, nw, nh, 20), P.l, P, 16, 9);
        kit.drawText(ctx, name, { x0: cx - nw / 2 + 65, x1: cx + nw / 2 - 65, y: ny + nh / 2, align: 'center', color: P.d, key: P.d }); ctx.restore(); }
      const qh = M.back(span(t, 0.95, 1.25));
      if (qh > 0) { ctx.save(); ctx.translate(cx, hy + hh / 2); ctx.scale(qh, qh); ctx.translate(-cx, -(hy + hh / 2));
        M.toon(ctx, M.rect(cx - hw / 2, hy, hw, hh, hh / 2), P.d, P, 8, 6);
        kit.drawText(ctx, handle, { x0: cx - hw / 2 + 35, x1: cx + hw / 2 - 35, y: hy + hh / 2, align: 'center', color: P.l, key: P.l }); ctx.restore(); }
      const qs = M.back(span(t, 1.25, 1.55));
      if (slogan && qs > 0) { ctx.save(); ctx.translate(cx, sy + sh / 2); ctx.rotate(0.025); ctx.scale(qs, qs); ctx.translate(-cx, -(sy + sh / 2));
        M.toon(ctx, M.rect(cx - sw / 2, sy, sw, sh, 16), P.a, P, 10, 7);
        kit.drawText(ctx, slogan, { x0: cx - sw / 2 + 40, x1: cx + sw / 2 - 40, y: sy + 10 + slogan.lead / 2, align: 'center', color: P.onA, key: P.onA }); ctx.restore(); }
    },
  };
}
