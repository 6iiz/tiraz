// Before and after, as two cards. The old card lies on the desk with the label printed on its head; the voxel toy stands on it, hops
// to its middle and stomps: the card jolts, its print greys out and an ink bar strikes the old value. Then the new card, all accent,
// glides in from the far side held up and is laid below it, and the toy hops down onto it and lands with a ring.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, toy = M.toy(brand, P);
  const C = T.card, x0 = C.x0 + C.pad, x1 = C.x1 - C.pad, maxW = x1 - x0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, minScale: 0.75, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the compare label' }) : null;
  const h1 = 60 + 20 + (label ? label.height : 0) + was.height + 34, h2 = now.height + 70, gap = 80;
  const top = kit.place(h1 + gap + h2, 720), top2 = top + h1 + gap;
  const yLabel = top + 80 + (label ? label.lead / 2 : 0), yWas = top + 80 + (label ? label.height : 0) + was.lead / 2, yNow = top2 + 35 + now.lead / 2;
  const mid = (C.x0 + C.x1) / 2, side = rtl ? C.x0 + 140 : C.x1 - 140;
  const stomp = at + 0.85, arrive = at + 1.3, stops = [{ t: 0, x: side, y: top }, { t: stomp - 0.3, x: mid, y: top, height: 110 },
    { t: arrive + 0.15, x: rtl ? C.x0 + 120 : C.x1 - 120, y: top2, height: 70 }, { t: arrive + 0.75, x: rtl ? C.x0 + 120 : C.x1 - 120, y: top2, height: 60 }];
  return {
    duration: d,
    draw(ctx, t) {
      ctx.save(); M.camera(ctx, W, H, t, at, rtl);
      ground.draw(ctx, t);
      const hit = t - stomp, jolt = hit > 0 && hit < 0.4 ? Math.sin(hit * 40) * Math.exp(-hit * 10) * 6 : 0, old = M.E(span(t, stomp, stomp + 0.25));
      ctx.save(); ctx.translate(0, jolt);
      M.card(ctx, P, C.x0, top, C.x1 - C.x0, h1, { r: C.r });
      M.printHead(ctx, P, C.x0, top, C.x1 - C.x0, rtl, brand);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.grey });
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: mix(P.ink, P.grey, old), key: mix(P.ink, P.grey, old) });
      if (old > 0) { const w = was.width + 30; ctx.fillStyle = P.ink; ctx.fillRect(rtl ? x1 + 15 - w * old : x0 - 15, yWas - 4, w * old, 9); }
      ctx.restore();
      const p = span(t, arrive - 0.4, arrive);
      if (p > 0) {
        const e = M.E(p);
        ctx.save(); ctx.translate((1 - e) * (rtl ? -1 : 1) * (W + 200), -(1 - e) * 60);
        M.card(ctx, P, C.x0, top2, C.x1 - C.x0, h2, { r: C.r, fill: P.accent, edge: P.chipEdge, lift: 1 - e });
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: P.onAccent, key: P.onAccent });
        ctx.restore();
      }
      const tr = M.track(stops, t, 0.3);
      M.ring(ctx, P, tr.x, tr.y, tr.landed);
      M.drawToy(ctx, toy, tr.x, tr.y, { air: tr.air, sq: tr.sq, e: span(t, at, at + 0.3), time: t + clock, flip: rtl ? tr.x > mid + 1 : tr.x < mid - 1 });
      ctx.restore();
    },
  };
}
