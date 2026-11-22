// Before and after on one line: it runs under the old value (writing it in grey), turns at the far end and strikes back through the
// middle of it in one long wavering stroke, drops down the reading-side margin to the new value, runs under it with one loop of the
// accent around it (writing it in ink), and wanders off. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 80, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the compare label' }) : null;
  const yLabel = 470, yWas = 470 + (label ? label.height : 0) + 100, yNow = yWas + was.height + 190;
  const wb = M.boxes(was, x0, x1, yWas, 'start', rtl), nb = M.boxes(now, x0, x1, yNow, 'start', rtl);
  const R = M.line(W, T, rtl), P = R.P, dir = R.dir, xs = rtl ? x1 + 34 : x0 - 34;
  const ext = (bx) => ({ near: rtl ? Math.max(...bx.map((b) => b.x + b.width)) : Math.min(...bx.map((b) => b.x)), far: rtl ? Math.min(...bx.map((b) => b.x)) : Math.max(...bx.map((b) => b.x + b.width)) });
  const We = ext(wb), yW = yWas + (was.rows.length - 1) * was.lead, yWu = yW + was.size * 0.9;
  R.enter(); P.to(R.mx(1050), 1150); P.to(xs, yWu).mark('u0');
  R.under(yWu, xs, We.far - dir * 26, []); P.mark('u1');
  const ys = yW - was.size * 0.1;
  P.to(We.far - dir * 70, ys + was.size * 0.3); P.to(We.far - dir * 40, ys);
  const n = 5; for (let i = 1; i <= n; i++) P.to(We.far - dir * 40 + (We.near - We.far + dir * 80) * (i / n), ys + (i % 2 ? -5 : 5));
  P.mark('s1');
  const nowG = { x0: Math.min(...nb.map((b) => b.x)), x1: Math.max(...nb.map((b) => b.x + b.width)), y: yNow + (now.rows.length - 1) * now.lead, row: 0, size: now.size };
  const yNu = nowG.y + now.size * 0.95;
  P.to(xs, yW + was.size * 0.8); P.to(xs, yNu - 40).mark('v0');
  R.under(yNu, xs, rtl ? x0 - 30 : x1 + 30, [nowG]); P.mark('v1');
  R.tail(13);
  const L = R.build(T);
  const sq = at < 0 ? Math.min(1, (-0.3 - at) / 1.7) : 1;
  const keys = [[at, 0], [at + 0.55 * sq, L.at.u1], [at + 0.95 * sq, L.at.u1 + 30], [at + 1.25 * sq, L.at.s1], [at + 1.45 * sq, L.at.v0], [at + 1.9 * sq, L.at.v1], [Math.max(at + 2.2 * sq, d - T.joint), L.total]];
  const wt = wb.map((b) => M.timeAt(keys, M.crossing(L, b, rtl))), nt = nb.map((b) => M.timeAt(keys, M.crossing(L, b, rtl, 'v0', 'v1')));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: K.grey, each: (w, i, b, c) => M.write(c, t, at + i * 0.08, b, label.size, rtl) });
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: K.grey, key: K.grey, each: (w, i, b, c) => M.write(c, t, wt[i], b, was.size, rtl) });
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: K.ink, key: K.ink, each: (w, i, b, c) => M.write(c, t, nt[i], b, now.size, rtl) });
      M.drawLine(ctx, L, M.headAt(keys, t), K);
    },
  };
}
