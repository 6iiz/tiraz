// A number on the white board: the marker writes the value large on the reading side, digit after digit from the left, boxes it with
// the accent marker, then draws a bowed arrow down to the label and writes the label there.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const str = (S.prefix ?? '') + kit.fmt(S.value, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(str, size, 700, 1) > maxW - 120 && size > 120) size -= 8;
  const nw = kit.numberWidth(str, size, 700, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 160, where: 'the count label' });
  const block = size * 1.2 + 150 + label.height, top = kit.place(block, 640);
  const yNum = top + size * 0.6, nx = rtl ? x1 - 30 - nw : x0 + 30;
  const bx = { x0: nx - 34, x1: nx + nw + 34, y0: yNum - size * 0.58, y1: yNum + size * 0.58 };
  const yLabel = bx.y1 + 110 + label.lead / 2;
  const frame = M.box(700, bx.x0, bx.y0, bx.x1, bx.y1);
  const lx0 = rtl ? x0 : x0 + 160, lx1 = rtl ? x1 - 160 : x1;
  const ax = (bx.x0 + bx.x1) / 2, tx = rtl ? lx1 - Math.min(label.rows[0].width, 420) / 2 : lx0 + Math.min(label.rows[0].width, 420) / 2;
  const arr = M.arrow(710, ax, bx.y1 + 22, Math.abs(tx - ax) < 60 ? tx + (rtl ? -60 : 60) : tx, yLabel - label.size * 0.8, rtl ? 0.2 : -0.2, 28);
  const t0 = at + 0.1, tN = t0 + 0.7, tB = tN + 0.1, tA = tB + 0.5, tL = tA + 0.35;
  const sLabel = M.schedule(label, tL, tL + 0.7, T.write.word);
  const bLabel = M.layout(label, { x0: lx0, x1: lx1, y: yLabel }, rtl);
  const jobs = [
    { s: t0, e: tN, color: P.ink, at: (p) => [nx + nw * p, yNum + size * 0.2 * Math.sin(p * 19)] },
    M.pathJob(frame, tB, tB + 0.45, P.accent), M.pathJob(arr, tA, tA + 0.3, P.accent),
    ...bLabel.map((b, i) => M.wordJob(b, sLabel[i].s, sLabel[i].e, P.ink)),
  ];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ink = M.ink(ctx, P.ink, P.board), acc = M.ink(ctx, P.accent, P.board, 7);
      ctx.save();
      if (M.write(ctx, span(t, t0, tN), { x: nx, y: yNum, width: nw }, size, false) !== false)
        kit.number(ctx, str, { x: nx, y: yNum, size, weight: 700, color: ink, align: 'left', settle: 1 });
      ctx.restore();
      M.trace(ctx, frame, span(t, tB, tB + 0.45), T.pen.line, acc);
      M.trace(ctx, arr, span(t, tA, tA + 0.3), T.pen.line, acc);
      kit.drawText(ctx, label, { x0: lx0, x1: lx1, y: yLabel, align: 'start', color: ink, key: acc,
        each: (w, i, box, c) => { if (M.write(c, span(t, sLabel[i].s, sLabel[i].e), box, label.size, w.arabic) === false) return false; } });
      M.drawPen(ctx, M.penAt(jobs, t, W, rtl), P, rtl);
    },
  };
}
