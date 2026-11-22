// A number, printed like a poster's big figure in two inks: the accent pull lays the shade face (the numeral pushed down and away by
// a few px), then the key-ink pull lays the lit face over it, and the figure rolls to its value while the second blade crosses. A
// stepped rule (three thinning accent bands) is pulled under it and the label is printed below in the key ink.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const room = SAFE.right - SAFE.left - 60;
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 40, minScale: 0.8, where: 'the count label' });
  const hNum = size * 1.1, block = hNum + 70 + label.height;
  const top = Math.min(kit.place(block, 720), T.floor - block);
  const yNum = top + hNum / 2, yRule = top + hNum + 18, yLabel = yRule + 52 + label.lead / 2;
  const nb = { x0: SAFE.left, x1: SAFE.right, y0: top - 10, y1: top + hNum + 10 };
  const sh = Math.max(6, size * 0.035);
  const tS = at, tK = at + T.dur.pull * 0.75, tR = tK + T.dur.pull * 0.6, tL = tR + T.dur.pull * 0.5;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, tS + 0.1, tK + T.dur.pull + 0.25), v = text(countValue(0, S.value, p, ease.outQuart));
      M.pull(ctx, span(t, tS, tS + T.dur.pull), nb, P.accent, P, () => kit.number(ctx, v, { x: W / 2 + sh, y: yNum + sh, size, color: P.accent, settle: p, decor: true }), { rtl, seed: 2 });
      M.pull(ctx, span(t, tK, tK + T.dur.pull), nb, P.ink, P, () => kit.number(ctx, v, { x: W / 2, y: yNum, size, color: P.ink, settle: p }), { rtl, seed: 5 });
      M.pull(ctx, span(t, tR, tR + T.dur.pull * 0.7), { x0: W / 2 - 200, x1: W / 2 + 200, y0: yRule - 4, y1: yRule + 26 }, P.accent, P, () => {
        ctx.fillStyle = P.accent; [[0, 10], [15, 6], [26, 3]].forEach(([dy, h]) => ctx.fillRect(W / 2 - 190, yRule + dy, 380, h));
      }, { rtl, seed: 9 });
      M.pull(ctx, span(t, tL, tL + T.dur.pull), { x0: SAFE.left, x1: SAFE.right, y0: yLabel - label.lead / 2, y1: yLabel + label.height - label.lead / 2 }, P.ink, P,
        () => kit.drawText(ctx, label, { x0: SAFE.left + 20, x1: SAFE.right - 20, y: yLabel, align: 'center', color: P.ink, key: P.ink }), { rtl, seed: 11 });
    },
  };
}
