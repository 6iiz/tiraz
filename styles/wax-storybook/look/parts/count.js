// A number drawn in heavy crayon: the numeral is pressed into the paper's tooth in the dark wax and counts up to its value, then a
// child's loop of the accent is drawn round it and four short strokes flick out from it. The label is printed under it, written in
// from the reading side. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, K = M.masks(W, H);
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 720 && size > 110) size -= 8;
  const nw = kit.numberWidth(text(S.value), size, 900, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 40, minScale: 0.7, where: 'the count label' });
  const yNum = 600, rx = Math.max(nw / 2 + 70, size * 0.62), ry = size * 0.66, yLabel = yNum + ry + 60 + label.lead / 2;
  const cx = W / 2, tc = at + 1.1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const b = ground.boil(t), p = M.E(span(t, at, at + 1.0)), ap = span(t, at - 0.05, at + 0.2);
      if (ap > 0) M.wax(ctx, K.heavy, [cx - nw / 2 - 40, yNum - size * 0.8, nw + 80, size * 1.6], (c) => {
        c.translate(0, (1 - M.E(ap)) * 30);
        kit.number(c, text(countValue(0, S.value, p)), { x: cx, y: yNum, size, color: P.ink, align: 'center', settle: p });
      });
      const lp = span(t, tc, tc + T.dur.scribble + 0.1);
      if (lp > 0) M.wax(ctx, K.mid, [cx - rx - 120, yNum - ry - 120, rx * 2 + 240, ry * 2 + 240], (c) => {
        M.stroke(c, M.loop(cx, yNum, rx, ry, b * 5 + 3), 9, P.deep, b * 7 + 1, M.E(lp));
        for (let i = 0; i < 4; i++) {
          const q = span(lp, 0.7 + i * 0.07, 0.85 + i * 0.07), a = -2.3 + i * 0.32 + (rtl ? 0 : Math.PI * 0.6);
          if (q > 0) M.stroke(c, [[cx + Math.cos(a) * (rx + 22), yNum + Math.sin(a) * (ry + 22)], [cx + Math.cos(a) * (rx + 70), yNum + Math.sin(a) * (ry + 70)]], 8, P.deep, b * 3 + i, q);
        }
      });
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: P.ink,
        each: (w, i, box, c) => M.write(c, span(t, at + 0.5 + i * T.dur.gap, at + 0.5 + i * T.dur.gap + T.dur.word), box, label.size, rtl) });
    },
  };
}
