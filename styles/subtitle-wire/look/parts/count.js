// A number with its evidence: the footage cuts to the source page and a highlighter runs along the line the figure comes from; then
// the figure is slammed on huge and rolls to its value in quick steps that slow as they land, with the label as a caption under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, shot: 'document', at });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 800, maxW, minScale: 0.75, where: 'the count label' });
  const ch = M.chunks(label, T.caption.chunk);
  const top = kit.place(size * 1.1 + label.height, 900), yNum = top + size * 0.5, yLabel = top + size * 1.1 + label.lead / 2;
  const t0 = at + 0.65, N = 18;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, top);
      const p = span(t, t0, t0 + T.dur.roll), k = Math.floor(p * N);
      ctx.save();
      if (M.slam(ctx, span(t, t0, t0 + T.dur.slam), W / 2, yNum, T) !== false) {
        ctx.shadowColor = rgba(P.dark, 0.6); ctx.shadowBlur = 30;
        const x = kit.rtl ? SAFE.right : SAFE.left;
        kit.number(ctx, text(countValue(0, S.value, k / N, ease.outCubic)), { x, y: yNum, size, color: P.light, align: kit.rtl ? 'right' : 'left', settle: p >= 1 ? 1 : 0 });
      }
      ctx.restore();
      M.caption(kit, ctx, label, { y: yLabel, t, t0: t0 + T.dur.roll + 0.05, gap: T.caption.gap, P, T, ch });
    },
  };
}
