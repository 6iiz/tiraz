// Before and after, as a revision on the sheet: the grey pen rasters the old value, the ink pen cancels it with a double strike and a
// cross, then the accent pen hatches a band and the ink pen rasters the new value over it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the compare label' }) : null;
  const yLabel = 470, yWas = 470 + (label ? label.height : 0) + 110, yNow = yWas + was.height + 150;
  const lb = label ? M.boxes(label, x0, x1, yLabel, 'start', rtl) : [], wb = M.boxes(was, x0, x1, yWas, 'start', rtl), nb = M.boxes(now, x0, x1, yNow, 'start', rtl);
  const lj = lb.map((b) => M.wordJob(b, 'grey', T, rtl, 0.8)), wj = wb.map((b) => M.wordJob(b, 'grey', T, rtl)), nj = nb.map((b) => M.wordJob(b, 'ink', T, rtl));
  const span0 = (bx) => ({ a: Math.min(...bx.map((b) => b.x)), b: Math.max(...bx.map((b) => b.x + b.width)), y0: Math.min(...bx.map((b) => b.y)), y1: Math.max(...bx.map((b) => b.y)) });
  const W0 = span0(wb), N0 = span0(nb), sz = was.size;
  const xs = rtl ? [W0.b + 16, W0.a - 16] : [W0.a - 16, W0.b + 16];
  const strike = M.strokeJob([[xs[0], W0.y0 - 6], [xs[1], W0.y1 - 6], [xs[1], W0.y1 + 8], [xs[0], W0.y0 + 8],
    [xs[0], W0.y0 - sz * 0.55], [xs[1], W0.y1 + sz * 0.55], [xs[1], W0.y0 - sz * 0.55], [xs[0], W0.y1 + sz * 0.55]], 'ink', T, { lifts: [2, 4, 6] });
  const pad = now.size * 0.18, r = { x: N0.a - pad, y: N0.y0 - now.size * 0.62, w: N0.b - N0.a + pad * 2, h: N0.y1 - N0.y0 + now.size * 1.24 };
  const band = M.hatchJob(r, 'accent', T, rtl), border = M.strokeJob([[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h], [r.x, r.y]], 'accent', T);
  border.after = true;
  const A = M.program([...lj, ...wj], { start: at, park: ground.park, by: at < 0 ? -0.3 : at + 0.75 });
  const tB = Math.max(A.end + 0.2, at + 0.9);
  const B = M.program([strike, band, border, ...nj], { start: tB, park: ground.park, from: A.pen(tB), by: tB + 1.0 });
  const penAt = M.chain([A, B]);
  const words = (jobs, P, t) => (w, i, b, c) => (M.rasterClip(c, jobs[i], P.q(jobs[i], t)) ? undefined : false);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: K.grey, each: words(lj, A, t) });
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: K.grey, key: K.grey, each: words(wj, A, t) });
      strike.draw(ctx, B.q(strike, t), K.ink, 4);
      band.draw(ctx, B.q(band, t), K.accent);
      border.draw(ctx, B.q(border, t), K.accent, 4);
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: K.ink, key: K.ink, each: words(nj, B, t) });
      ground.machine(ctx, penAt(t));
    },
  };
}
