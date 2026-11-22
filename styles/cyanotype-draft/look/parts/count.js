// A number as a measured figure: a large white numeral, centred, develops behind the rinse front while it counts up to its value;
// a dimension line with drawn arrowheads then opens under it from the middle out, and the label develops beneath as the figure's
// note. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, lerp, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0 - 40;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > maxW && size > 120) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 500, maxW, minScale: 0.9, where: 'the count label' });
  const nw = kit.numberWidth(text(S.value), size, 800, 1), block = size * 1.2 + 110 + label.height;
  const top = kit.place(block, 720), yNum = top + size * 0.6, yDim = yNum + size * 0.6 + 40, yLabel = yDim + 50 + label.lead / 2;
  const fA = top - 100, fB = yLabel + label.height, front = (t) => lerp(fA, fB, span(t, at, at + T.dur.front * 1.3));
  const out = (t) => M.WASH(span(t, d - T.dur.out, d));
  const band = M.makeWash(W, pal);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fy = front(t); if (fy < fB) M.drawWash(ctx, band, fy);
      const k = 1 - out(t);
      const pn = M.DEV(span(t, at + 0.15, at + 0.6)) * k;
      if (pn > 0) {
        const pc = span(t, at + 0.15, at + 1.4);
        kit.number(ctx, text(countValue(0, S.value, pc, ease.outCubic)), { x: W / 2, y: yNum + (1 - pn) * 10, size, weight: 800, color: M.tone(pal, pn), align: 'center', settle: pc });
      }
      const pd = span(t, at + 1.2, at + 1.6) * k;
      if (pd > 0) M.dimension(ctx, W / 2 - nw / 2, W / 2 + nw / 2, yNum + size * 0.42, yDim, pd, M.tone(pal, 1, pal.soft));
      const pl = M.DEV(span(t, at + 0.4, at + 0.4 + T.dur.dev)) * k;
      if (pl > 0) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: pal.white, each: (w, i, box, c) => { c.translate(0, (1 - pl) * 8); return M.tone(pal, pl); } });
    },
  };
}
