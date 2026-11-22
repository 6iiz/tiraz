// A number under the model town: the marks pop in, then a big numeral in ink with a hard accent shadow rolls up to its value (one value
// a frame, steps shrinking towards the end) and lands; on the landing two small Memphis shapes pop out beside it. The label sits under
// it in a softer ink. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, mix, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, Z = T.zone, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > SAFE.right - SAFE.left - 220 && size > 100) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 40, minPx: 44, where: 'the count label' });
  const yNum = Z.top + size * 0.58, yLabel = yNum + size * 0.62 + 34 + label.lead / 2;
  const w = kit.numberWidth(text(S.value), size, 900, 1), soft = mix(P.ink, P.paper, 0.3), land = at + 1.0;
  const dec = spec.decimals ?? 0, roll = (p) => { const v = countValue(0, S.value, p, ease.outQuart); return p >= 1 ? S.value : Math.round(v * 10 ** dec) / 10 ** dec; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), p = span(t, at, land);
      M.marksRow(ctx, P, t, at, rtl ? SAFE.right : SAFE.left, Z.marks, rtl, out);
      ctx.save();
      if (M.pop(ctx, span(t, at, at + T.dur.in), W / 2, yNum, -4) !== false && M.leave(ctx, out, W / 2, yNum) !== false) {
        const str = text(roll(p));
        kit.number(ctx, str, { x: W / 2 + 10, y: yNum + 10, size, color: P.accent, align: 'center', settle: p, decor: true });
        kit.number(ctx, str, { x: W / 2, y: yNum, size, color: P.ink, align: 'center', settle: p });
      }
      ctx.restore();
      // on the landing, a zigzag and a dot pop out on either side of the numeral
      [[2, -1, P.accent], [0, 1, P.pastel]].forEach(([k, side, c], i) => {
        const q = span(t, land + i * 0.06, land + 0.4 + i * 0.06); if (q <= 0 || out >= 1) return;
        const x = W / 2 + side * (w / 2 + 70), y = yNum - size * 0.25 + i * 30;
        ctx.save(); M.pop(ctx, q, x, y, 25); M.leave(ctx, out, x, y); M.mark(ctx, P, k, x, y, 54, c); ctx.restore();
      });
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: soft,
        each: (wd, i, box, c) => { const t0 = at + 0.25 + i * 0.05; if (M.pop(c, span(t, t0, t0 + T.dur.in), box.x + box.width / 2, box.y) === false) return false; if (M.leave(c, out, box.x + box.width / 2, box.y) === false) return false; } });
    },
  };
}
