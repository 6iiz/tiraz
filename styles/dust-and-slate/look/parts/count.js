// A number on the slate: the value is written large in white chalk, digit after digit from the left as figures are written, then
// underlined twice with the accent stick, the way a teacher marks the answer. The label is written under it in the dimmer chalk.
// The value is written as it is (no counting up): chalk cannot roll. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 20, x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const str = (S.prefix ?? '') + kit.fmt(S.value, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(str, size, 800, 1) > maxW - 40 && size > 120) size -= 8;
  const nw = kit.numberWidth(str, size, 800, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, where: 'the count label' });
  const block = size * 1.1 + 70 + label.height, top = kit.place(block, 650);
  const yNum = top + size * 0.55, yU = yNum + size * 0.52, yLabel = yU + 70 + label.lead / 2;
  const nx = W / 2 - nw / 2, t0 = at + 0.05, tN = t0 + 0.75;
  const u1 = M.stroke(91, nx - 20, yU, nx + nw + 20, yU + 3, 6), u2 = M.stroke(92, nx + 10, yU + 22, nx + nw - 10, yU + 24, 5);
  const sLabel = M.schedule(label, tN + 0.5, tN + 0.5 + 0.8, T.write.word);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const white = M.chalk(ctx, P.chalk), acc = M.chalk(ctx, P.accent, 17), dim = M.chalk(ctx, P.dim, 13);
      ctx.save();
      if (M.write(ctx, span(t, t0, tN), { x: nx, y: yNum, width: nw }, size, false) !== false)
        kit.number(ctx, str, { x: W / 2, y: yNum, size, weight: 800, color: white, align: 'center', settle: 1 });
      ctx.restore();
      M.trace(ctx, kit.rtl ? [...u1].reverse() : u1, span(t, tN + 0.05, tN + 0.3), T.chalk.line, acc);
      M.trace(ctx, kit.rtl ? [...u2].reverse() : u2, span(t, tN + 0.3, tN + 0.5), T.chalk.line, acc);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, color: dim, key: acc,
        each: (w, i, box, c) => { if (M.write(c, span(t, sLabel[i].s, sLabel[i].e), box, label.size, w.arabic) === false) return false; } });
    },
  };
}
