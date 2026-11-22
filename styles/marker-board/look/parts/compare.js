// Before and after on the white board: the marker writes the old value in a lighter hand and strikes it through with one straight line,
// draws a bowed arrow down from it on the reading side, and writes the new value under it with the accent marker, then throws a ring round
// it. Both stay on the board: the change reads as a step. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 700, maxW: maxW - 200, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const drop = 250, block = (label ? label.lead + 40 : 0) + was.lead + drop, top = kit.place(block, 640);
  const yLabel = top + (label ? label.lead / 2 : 0), yW = top + (label ? label.lead + 40 : 0) + was.lead / 2, yN = yW + drop;
  const T0 = at + 0.1, tW = T0 + 0.35, tS = tW + 0.5, tA = tS + 0.3, tN = tA + 0.35, tR = tN + 0.5;
  const sLabel = label ? M.schedule(label, T0, T0 + 0.32, 0.04) : [], sWas = M.schedule(was, tW, tW + 0.45, 0.05), sNow = M.schedule(now, tN, tN + 0.45, 0.05);
  const bLabel = label ? M.layout(label, { x0, x1, y: yLabel, align: 'center' }, rtl) : [];
  const bWas = M.layout(was, { x0, x1, y: yW, align: 'center' }, rtl), bNow = M.layout(now, { x0, x1, y: yN, align: 'center' }, rtl);
  const wl = W / 2 - was.width / 2, wr = W / 2 + was.width / 2, nl = W / 2 - now.width / 2, nr = W / 2 + now.width / 2;
  const strike = rtl ? M.stroke(910, wr + 20, yW + 6, wl - 20, yW + 2, 2) : M.stroke(910, wl - 20, yW + 6, wr + 20, yW + 2, 2);
  const sx = rtl ? Math.max(wr, nr) + 40 : Math.min(wl, nl) - 40;
  const arr = M.arrow(920, sx, yW + 20, rtl ? nr + 46 : nl - 46, yN - 6, rtl ? -0.35 : 0.35, 30);
  const loop = M.ring(930, W / 2, yN + 4, now.width / 2 + 44, now.size * 0.74);
  const jobs = [
    ...bLabel.map((b, i) => M.wordJob(b, sLabel[i].s, sLabel[i].e, P.soft)),
    ...bWas.map((b, i) => M.wordJob(b, sWas[i].s, sWas[i].e, P.soft)),
    M.pathJob(strike, tS, tS + 0.18, P.ink), M.pathJob(arr, tA, tA + 0.28, P.accent),
    ...bNow.map((b, i) => M.wordJob(b, sNow[i].s, sNow[i].e, P.accent)), M.pathJob(loop, tR, tR + 0.36, P.accent),
  ];
  const writer = (t, sched, size) => (w, i, box, c) => { if (M.write(c, span(t, sched[i].s, sched[i].e), box, size, w.arabic) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ink = M.ink(ctx, P.ink, P.board), soft = M.ink(ctx, P.soft, P.board, 6), acc = M.ink(ctx, P.accent, P.board, 7);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, color: soft, key: soft, each: writer(t, sLabel, label.size) });
      kit.drawText(ctx, was, { x0, x1, y: yW, color: soft, key: soft, each: writer(t, sWas, was.size) });
      M.trace(ctx, strike, span(t, tS, tS + 0.18), T.pen.line, ink);
      M.trace(ctx, arr, span(t, tA, tA + 0.28), T.pen.line, acc);
      kit.drawText(ctx, now, { x0, x1, y: yN, color: acc, key: acc, each: writer(t, sNow, now.size) });
      M.trace(ctx, loop, span(t, tR, tR + 0.36), T.pen.line, acc);
      M.drawPen(ctx, M.penAt(jobs, t, W, rtl), P, rtl);
    },
  };
}
