// A count read off the chart: the numeral sits in a calm the threads part round, and rolls up to its value with steps that shrink
// toward the end while a gust in the accent is drawn under it from upwind; the strokes passing the number turn the accent as it
// lands. The label is carried in under it and may take two rows. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const fin = text(S.value);
  let size = T.size.count; while (kit.numberWidth(fin, size, 800, 1) > 860 && size > 120) size -= 8;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minPx: T.minPx, where: 'the count label' });
  const block = size * 1.15 + 40 + label.height, top = kit.place(block, 720);
  const yNum = top + size * 0.55, yRib = top + size * 1.12, yLabel = yRib + 40 + label.lead / 2, w = kit.numberWidth(fin, size, 800, 1);
  const nx0 = rtl ? x1 - w : x0, nx1 = nx0 + w;
  const LB = M.layout(label, { x0, x1, y: yLabel }, rtl);
  const TH = ground.threads([{ cx: (nx0 + nx1) / 2, cy: yNum, a: w / 2 + 150, b: size * 0.85 }, ...LB.rows.map((r) => M.calm(r, label.size))], 23);
  const roll = 1.3, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      const p = span(t, at, at + roll), out = span(t, out0, d), rib = span(t, at + 0.3, at + roll);
      ground.draw(ctx, t, TH, { gusts: [{ cx: (nx0 + nx1) / 2, cy: yNum, a: w / 2 + 220, b: size, k: M.S(span(t, at + roll - 0.2, at + roll + 0.2)) * (1 - out) }] });
      M.ribbon(ctx, nx0, nx1, yRib, rib, out, pal.gust, rtl, 14);
      if (p > 0 && out < 1) {
        const v = countValue(0, S.value, Math.round(ease.outQuart(p) * 30) / 30, (x) => x), up = rtl ? 1 : -1;
        ctx.save(); ctx.globalAlpha = Math.min(1, p * 3.5) * (1 - out); ctx.translate(up * T.drift * (1 - M.E(span(t, at, at + 0.6))) - up * T.drift * 1.6 * M.I(out), 0);
        kit.number(ctx, text(v), { x: rtl ? nx1 : nx0, y: yNum, size, weight: 800, color: pal.ink, align: rtl ? 'right' : 'left', settle: p }); ctx.restore();
      }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.lead,
        each: (wd, i, box, c) => { const t0 = at + 0.6 + i * 0.08; return M.blow(c, span(t, t0, t0 + T.dur.in), out, rtl, T.drift); } });
    },
  };
}
