// A number on the town square: a big numeral stands up off the page and counts to its value while a queue of townsfolk stands up one
// after another on the square below it, as if the count were people arriving; the label stands up word by word between them, a key
// phrase under an awning. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 880 && size > 120) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minPx: 44, where: 'the count label' });
  const block = size * 1.0 + 30 + label.height + 150, top = kit.place(block, 680);
  const yNum = top + size * 0.5, yLabel = top + size + 30 + label.lead / 2, yQ = top + size + 30 + label.height + 120;
  const runs = M.keyRuns(label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center' }, rtl);
  const n = 9, gapX = 74, q0 = W / 2 + ((n - 1) / 2) * gapX * (rtl ? 1 : -1);
  const c0 = at + 0.1, c1 = at + 1.5;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, c0, c1);
      for (let k = 0; k < n; k++) {                                         // the queue grows from the reading side with the count
        const kp = span(t, c0 + (k / n) * (c1 - c0), c0 + (k / n) * (c1 - c0) + 0.3);
        M.person(ctx, q0 - k * gapX * (rtl ? 1 : -1), yQ + (k % 2) * 8, 1.35, pal.coats[k % pal.coats.length], pal, 0, M.E(kp));
      }
      if (t >= c0) {
        ctx.save(); const base = yNum + size * 0.4, s = M.E(span(t, c0, c0 + 0.4)); ctx.translate(0, base); ctx.scale(1, Math.max(0.02, s)); ctx.translate(0, -base);
        kit.number(ctx, text(countValue(0, S.value, p, ease.outQuart)), { x: W / 2, y: yNum, size, color: pal.ink, align: 'center', settle: p });
        ctx.restore();
      }
      for (const r of runs) { const s = c1 - 0.3 + r.first * 0.07; M.awning(ctx, r, label.size, span(t, s, s + 0.4), pal); }
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: pal.ink, key: pal.onAccent,
        each: (w, i, box, c) => { const s = c1 - 0.3 + i * 0.07; if (M.unfold(c, span(t, s, s + T.dur.in), box, label.size) === false) return false; } });
    },
  };
}
