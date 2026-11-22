// Before and after as a scene change: the old value stands in the follow-spot, a line of light strikes it, and it is hauled up into
// the flies and out of sight behind the pelmet. Then the new value comes down on a marquee board in the same light, stops, sways and
// hangs, its bulbs coming on round the frame. The label is lit on the wall above.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0 - 160;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 500, maxW: x1 - x0, minScale: 0.9, where: 'the compare label' }) : null;
  const bw = Math.max(now.width, was.width) + 150, bh = now.size * 1.25 + 44;
  const block = (label ? label.height + 70 : 0) + bh, top = Math.max(SAFE.top + 30, kit.place(block, 740));
  const yLabel = top + (label ? label.lead / 2 : 0), by = top + (label ? label.height + 70 : 0), yV = by + bh / 2, cx = W / 2;
  const strikeT = at + 0.6, upT = at + 0.85, downT = at + 1.2;
  const bulb = M.bulbSprite(pal), sprite = M.pool(pal.light, 900, 0.13, 0.8);
  const outP = (t) => span(t, d - T.dur.out, d);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = 1 - M.OUT(outP(t)), sp = M.IN(span(t, at, at + 0.4)) * k;
      M.spot(ctx, sprite, cx, yV - 20, (bw / 2 + 150) * sp, (bh + 260) * sp * 0.75);
      if (label && sp > 0) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: pal.dim, each: () => M.lit(pal, sp, pal.dim) });
      // the old value: in the light, struck, then flown out behind the pelmet
      const up = M.OUT(span(t, upT, upT + 0.45));
      if (up < 1 && sp > 0) {
        const dy = -up * (yV - M.PELMET + was.size);
        ctx.save(); ctx.beginPath(); ctx.rect(0, M.PELMET, W, H); ctx.clip(); ctx.translate(0, dy);
        if (up > 0) M.lines(ctx, pal, cx - was.width / 2, cx + was.width / 2, yV - was.size * 0.6);
        kit.drawText(ctx, was, { x0, x1, y: yV, align: 'center', color: M.lit(pal, sp * 0.8), key: M.lit(pal, sp * 0.8), decor: up > 0 });
        const ps = span(t, strikeT, strikeT + 0.2);
        if (ps > 0) { ctx.fillStyle = pal.bulb; ctx.fillRect(cx + was.width / 2 + 20 - (was.width + 40) * ps, yV - 3, (was.width + 40) * ps, 6); }
        ctx.restore();
      }
      // the new value on a flown marquee board
      const f = M.flown(t, downT, T.dur.fly, outP(t), by + bh + 80);
      if (f) {
        ctx.save(); ctx.translate(cx, M.PELMET); ctx.rotate(f.a); ctx.translate(-cx, -M.PELMET + f.dy);
        M.lines(ctx, pal, cx - bw / 2 + 40, cx + bw / 2 - 40, by);
        M.marquee(ctx, pal, bulb, cx - bw / 2, by, cx + bw / 2, by + bh, t + clock, span(t, downT + T.dur.fly * 0.55, downT + T.dur.fly * 0.55 + T.dur.marquee));
        kit.drawText(ctx, now, { x0, x1, y: yV, align: 'center', color: pal.light, key: pal.light, decor: Math.abs(f.dy) > 4 });
        ctx.restore();
      }
    },
  };
}
