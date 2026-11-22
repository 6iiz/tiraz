// Before and after in two cells: the label in a merged range, the old value in a merged cell under it, the new one in the cell below.
// A formula comparing the two is typed into the bar; on Enter the old cell's rule fires (it greys and is struck through, as a format),
// the selection hops down, and the new cell fires into the accent. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette, S = M.sheet(T, W, rtl);
  const all = S.rect(0, 0, S.cols - 1, 0), x0 = Math.max(all.x + 26, SAFE.left + 6), x1 = Math.min(all.x + all.w - 26, SAFE.right - 6), maxW = x1 - x0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S0.unit ? ' ' + S0.unit : '');
  const [was, now] = kit.fitAll([asText(S0.was), asText(S0.now)], { size: T.size.compare, weight: 800, maxW: maxW - 60, single: true, where: 'a compared value' });
  const label = S0.label ? M.balanced(kit, S0.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the compare label' }) : null;
  const nL = label ? M.rowsFor(label, S.rh, 0.3) : 0, nV = M.rowsFor(was, S.rh, 0.9);
  const total = (label ? nL + 1 : 0) + nV * 2 + 1;
  const r0 = Math.max(1, Math.round((700 - (total * S.rh) / 2 - S.top) / S.rh)), rW = r0 + (label ? nL + 1 : 0), rN = rW + nV + 1;
  const yMid = (r, n) => S.yOf(r) + (n * S.rh) / 2;
  const formula = `=IF(${M.ref(0, rW)}<>${M.ref(0, rN)},${M.ref(0, rN)})`;
  const enter = at + 0.2 + formula.length * T.dur.char, cutT = Math.max(enter, at + 0.85), nowT = at + 1.35;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.formulaBar(ctx, T, P, ground.mono, t, at + 0.2, t >= nowT ? M.ref(0, rN) : M.ref(0, rW), formula, W);
      if (label) { M.merged(ctx, S, 0, r0, S.cols - 1, r0 + nL - 1, P); kit.drawText(ctx, label, { x0, x1, y: yMid(r0, nL) - ((label.rows.length - 1) * label.lead) / 2, align: 'start', color: P.muted }); }
      const RW = M.merged(ctx, S, 0, rW, S.cols - 1, rW + nV - 1, P), RN = M.merged(ctx, S, 0, rN, S.cols - 1, rN + nV - 1, P);
      const cut = t >= cutT;
      if (cut) M.paint(ctx, RW, t, cutT, P.grey, P, T.dur.flash);
      if (t >= at + 0.1) {
        kit.drawText(ctx, was, { x0: x0 + 10, x1: x1 - 10, y: yMid(rW, nV), align: 'start', color: cut ? P.muted : P.ink, key: cut ? P.muted : P.ink });
        if (cut) {                                                     // strikethrough, the width of the word
          const w = was.width * span(t, cutT, cutT + 0.12), xs = rtl ? x1 - 10 - w : x0 + 10;
          ctx.fillStyle = P.ink; ctx.fillRect(xs, yMid(rW, nV) + 2, w, 5);
        }
      }
      if (t >= nowT) {
        M.paint(ctx, RN, t, nowT, P.accent, P, T.dur.flash);
        kit.drawText(ctx, now, { x0: x0 + 10, x1: x1 - 10, y: yMid(rN, nV), align: 'start', color: P.on(P.accent), key: P.on(P.accent) });
      }
      M.selection(ctx, t >= nowT ? RN : RW, P, t, rtl, t >= nowT);
    },
  };
}
