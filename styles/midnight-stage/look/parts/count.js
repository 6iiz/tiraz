// A number as a flown sign: a marquee board comes down from the flies on two lines, stops and sways a little before it hangs still;
// its bulbs come on round the frame and the number on it counts up to its value. The label is lit by a low spot under the board.
// At the end the board is hauled out upward. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0 - 30;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > maxW - 140 && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, minScale: 0.9, where: 'the count label' });
  const bw = Math.max(380, kit.numberWidth(text(S.value), size, 800, 1) + 150), bh = size * 1.15 + 40;
  const cx = W / 2, by = Math.max(SAFE.top + 40, kit.place(bh + 90 + label.height, 720)), yNum = by + bh / 2, yLabel = by + bh + 90 + label.lead / 2;
  const bulb = M.bulbSprite(pal), sprite = M.pool(pal.light, 800, 0.12, 0.7);
  const t0 = at, land = at + T.dur.fly * 0.55, outP = (t) => span(t, d - T.dur.out, d);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const f = M.flown(t, t0, T.dur.fly, outP(t), by + bh + 60);
      const ql = M.IN(span(t, at + 0.5, at + 0.5 + 0.4)) * (1 - M.OUT(outP(t)));
      M.spot(ctx, sprite, cx, yLabel, (label.width / 2 + 120) * ql, 110 * ql);
      if (f) {
        ctx.save(); ctx.translate(cx, M.PELMET); ctx.rotate(f.a); ctx.translate(-cx, -M.PELMET + f.dy);
        M.lines(ctx, pal, cx - bw / 2 + 40, cx + bw / 2 - 40, by);
        const on = span(t, land, land + T.dur.marquee);
        M.marquee(ctx, pal, bulb, cx - bw / 2, by, cx + bw / 2, by + bh, t + clock, on);
        const pc = span(t, land, land + 1.1);
        kit.number(ctx, text(countValue(0, S.value, pc, ease.outCubic)), { x: cx, y: yNum, size, weight: 800, color: pal.light, align: 'center', settle: pc, decor: Math.abs(f.dy) > 4 });
        ctx.restore();
      }
      if (ql > 0) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: pal.light, each: () => M.lit(pal, ql) });
    },
  };
}
