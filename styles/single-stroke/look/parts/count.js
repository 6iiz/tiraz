// A number, ringed by the line: it climbs the reading-side margin, swings once around the figure in the accent (the figure is written
// as the loop begins and its value settles as the loop closes), drops back to the margin, runs under the label writing it, and
// wanders off. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, SAFE, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 120 && size > 120) size -= 8;
  const nw = kit.numberWidth(text(S.value), size, 900, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const yNum = 560, nx = rtl ? x1 - 50 - nw : x0 + 50, yLabel = yNum + size * 0.62 + 70 + label.lead / 2, yU = yLabel + (label.rows.length - 1) * label.lead + label.size * 0.95;
  const R = M.line(W, T, rtl), P = R.P, dir = R.dir, xs = rtl ? x1 + 34 : x0 - 34, xe = rtl ? x0 - 30 : x1 + 30;
  const cx = nx + nw / 2, rx = nw / 2 + size * 0.3, ry = size * 0.56;
  R.enter(); P.to(R.mx(1052), 1120); P.to(xs, yNum + size * 0.2).mark('l0');
  P.loop(cx, yNum, rx, ry, rtl ? 0.2 : Math.PI - 0.2, 1.08, rtl ? -1 : 1, true); P.mark('l1');
  P.to(xs + dir * 6, yNum + size * 0.7); P.to(xs, yU).mark('u0');
  R.under(yU, xs, xe, []); P.mark('u1'); R.tail(5);
  const L = R.build(T);
  const fast = Math.min(0.95 + L.at.u1 / 6000, at < 0 ? -0.28 - at : 9);
  const keys = [[at, 0], [at + fast * 0.25, L.at.l0], [at + fast * 0.62, L.at.l1], [at + fast, L.at.u1], [Math.max(at + fast + 0.3, d - T.joint), L.total]];
  const tNum = M.timeAt(keys, L.at.l0), tSet = M.timeAt(keys, L.at.l1);
  const lt = M.boxes(label, x0, x1, yLabel, 'start', rtl).map((b) => M.timeAt(keys, M.crossing(L, b, rtl)));
  const numBox = { x: nx, y: yNum, width: nw };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.drawLine(ctx, L, M.headAt(keys, t), K);
      const p = (t - tNum) / (tSet - tNum);
      if (t >= tNum) {
        ctx.save(); M.write(ctx, t, tNum, numBox, size, rtl, 0.25);
        kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: rtl ? nx + nw : nx, y: yNum, size, color: K.ink, align: rtl ? 'right' : 'left', settle: Math.min(1, Math.max(0, p)) });
        ctx.restore();
      }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: K.grey, each: (w, i, b, c) => M.write(c, t, lt[i], b, label.size, rtl) });
    },
  };
}
