// A number as a scoreboard on the sunburst set: a paper board pops in, the number climbs one step per half-beat (the board nods on
// each step), and on the last step the board turns to the accent with a burst: the round is won. The label sits on an ink banner
// under the board. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, set: 'burst' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 700 && size > 110) size -= 6;
  const numW = kit.numberWidth(text(S.value), size, 900, 1), bw = Math.min(SAFE.right - SAFE.left - 14, Math.max(numW + 160, 470)), bh = size * 1.3;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 120, minScale: 0.9, minPx: 44, where: 'the count label' });
  const lw = label.width + 72, lh = label.height + 20;
  const top = kit.place(bh + 50 + lh, 660), bx = W / 2 - bw / 2, ly = top + bh + 50, lx = W / 2 - lw / 2;
  const yNum = top + bh / 2, steps = 6, t0 = at + 0.25, stepDur = T.beat / 2, win = t0 + (steps - 1) * stepDur;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.shrink(span(t, d - T.dur.out, d));
      if (out <= 0) return;
      ctx.save(); M.around(ctx, W / 2, top + (bh + 50 + lh) / 2, out);
      const k = Math.min(steps, Math.max(0, Math.floor((t - t0) / stepDur) + 1)), p = t < t0 ? 0 : k / steps;
      const since = t < t0 ? 1 : (t - t0) % stepDur;
      const nodS = k > 0 && k < steps ? 1 + 0.04 * Math.max(0, 1 - since / 0.1) : M.nod(t, win + 0.6, T.beat);
      const won = t >= win, s = M.pop(span(t, at, at + T.dur.pop)) * nodS * (1 + 0.08 * Math.sin(Math.PI * span(t, win, win + 0.2)));
      if (s > 0) {
        M.burst(ctx, W / 2, yNum, bw / 2, bh / 2, span(t, win + 0.04, win + 0.45), pal.ink, 16);
        ctx.save(); M.around(ctx, W / 2, yNum, s);
        M.card(ctx, bx, top, bw, bh, won ? pal.accent : pal.paper, pal.ink, T, { r: 46, stroke: 10, shadow: 18 });
        kit.number(ctx, text(countValue(0, S.value, p, (x) => x)), { x: W / 2, y: yNum + size * 0.04, size, color: won ? pal.onAccent : pal.ink, align: 'center', settle: p });
        ctx.restore();
      }
      const ls = M.pop(span(t, at + 0.4, at + 0.4 + T.dur.pop));
      if (ls > 0) {
        ctx.save(); M.around(ctx, W / 2, ly + lh / 2, ls);
        M.ribbon(ctx, lx, ly, lw, lh, pal);
        kit.drawText(ctx, label, { x0: lx + 36, x1: lx + lw - 36, y: ly + 10 + label.lead / 2, align: 'center', color: pal.paper });
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
