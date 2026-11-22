// A count is a reading. The numeral comes into focus while it rolls up to its value, with steps that shrink toward the end, and a
// dimension line in the accent grows from its centre under it and drops its end ticks as the number lands. The label sits under the
// line in a lighter ink and may take two rows. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, L = T.lens;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > 760 && size > 120) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: 760, minPx: T.minPx, where: 'the count label' });
  const block = size * 1.05 + 60 + label.height, top = kit.place(block, L.cy);
  const yNum = top + size * 0.5, yDim = top + size * 1.05, yLabel = yDim + 50 + label.lead / 2;
  const roll = 1.3, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, at, at + roll), out = span(t, out0, d), o = M.I(out);
      const v = countValue(0, S.value, Math.round(ease.outQuart(p) * 40) / 40, (x) => x), str = text(v), w = kit.numberWidth(text(S.value), size, 800, 1);
      const pin = span(t, at, at + 0.7);
      if (pin > 0 && out < 1) {
        ctx.save(); ctx.globalAlpha = Math.min(1, pin * 2.4) * (1 - o);
        const b = T.blur * ((1 - M.E(pin)) + o); if (b > 0.4) ctx.filter = `blur(${b.toFixed(1)}px)`;
        kit.number(ctx, str, { x: L.cx, y: yNum, size, weight: 800, color: pal.ink, align: 'center', settle: p });
        ctx.restore();
      }
      M.dimension(ctx, L.cx - w / 2, L.cx + w / 2, yDim, span(t, at + 0.5, at + roll), out, pal.ring, 5);
      kit.drawText(ctx, label, { x0: L.cx - 380, x1: L.cx + 380, y: yLabel, align: 'center', color: pal.lead,
        each: (wd, i, box, c) => { const t0 = at + 0.7 + i * 0.09; return M.focus(c, span(t, t0, t0 + T.dur.in), out, box, label.size, T.blur); } });
    },
  };
}
