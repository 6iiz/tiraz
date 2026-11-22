// Before and after, acted out by two people. The old value stands in grey beside a slumped grey figure; an ink line crosses it out.
// From that figure a curved line drops to the row below, the accent runs down it, and there an upright person with the accent head
// throws both arms up as the new value is set down in ink with the accent underline. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const ind = 190, dir = rtl ? -1 : 1, xr = rtl ? SAFE.right - 70 : SAFE.left + 70, x0 = rtl ? SAFE.left + 10 : SAFE.left + ind, x1 = rtl ? SAFE.right - ind : SAFE.right - 10;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: x1 - x0, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 500, maxW: SAFE.right - SAFE.left - 20, minScale: 0.9, where: 'the compare label' }) : null;
  const fh = 200, lH = label ? label.height + 50 : 0, top = kit.place(lH + 2 * fh + 140, 700);
  const yL = top + (label ? label.lead / 2 : 0), f1 = top + lH + fh, f2 = f1 + 140 + fh, yWas = f1 - fh * 0.5, yNow = f2 - fh * 0.5;
  const tCross = at + 0.8, tRun = at + 1.15, tNow = at + 1.55;
  const wb = M.layout(was, { x0, x1, y: yWas, align: 'start' }, rtl), wa = Math.min(...wb.map((b) => b.x)), wz = Math.max(...wb.map((b) => b.x + b.width));
  const keys = M.keySpans(now, { x0, x1, y: yNow, align: 'start' }, rtl, true);
  const conn = []; for (let i = 0; i <= 20; i++) { const u = i / 20; conn.push([xr + dir * 60 * Math.sin(Math.PI * u), M.lerp(f1 + 10, f2 - fh * 0.95, u)]); }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ground.crowd(ctx, t, {});
      if (label) kit.drawText(ctx, label, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: yL, align: 'start', color: P.note, key: P.ink, each: (w, i, box, c) => M.setDown(c, span(t, at + i * 0.07, at + 0.22 + i * 0.07), label.size) });
      const w = M.weight(fh);
      // the old: a slumped grey person on a short grey rule
      const p1 = span(t, at + 0.15, at + 0.4);
      if (p1 > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, p1 * 3);
        M.run(ctx, [[xr - 70, f1], [xr + 70, f1]], Infinity, w, P.slump);
        M.figure(ctx, P, xr, f1, fh, { slump: M.ease.outCubic(span(t, tCross, tCross + 0.4)) * 0.9 + 0.1, color: P.slump });
        ctx.restore();
      }
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: P.note, key: P.note, each: (wd, i, box, c) => M.setDown(c, span(t, at + 0.25 + i * 0.07, at + 0.47 + i * 0.07), was.size) });
      const cp = M.ease.inOutCubic(span(t, tCross, tCross + 0.3));
      if (cp > 0) { const a = rtl ? wz + 12 : wa - 12, b = rtl ? wa - 12 : wz + 12; M.run(ctx, [[a, yWas + was.size * 0.05], [M.lerp(a, b, cp), yWas + was.size * 0.05]], Infinity, Math.max(8, was.size * 0.09), P.ink); }
      // the connector and the run down it
      const cg = span(t, tCross + 0.1, tRun);
      if (cg > 0) M.run(ctx, conn, M.lengthOf(conn) * cg, w, P.ink);
      const rp = span(t, tRun, tNow);
      if (rp > 0) M.run(ctx, conn, M.lengthOf(conn) * rp, w * 1.2, P.accent);
      // the new: an upright person with the accent head, arms thrown up on arrival
      const p2 = span(t, tNow - 0.1, tNow + 0.1);
      if (p2 > 0) {
        const since = t - tNow, up = M.ease.outCubic(span(t, tNow, tNow + 0.25)), sh = [xr, f2 - fh * (0.46 + 0.34 * 0.86) - M.reactHop(since, fh * 1.6)];
        M.run(ctx, [[xr - 70, f2], [xr + 70, f2]], Infinity, w, P.ink);
        const hands = { l: [sh[0] - fh * M.lerp(0.12, 0.3, up), sh[1] + fh * M.lerp(0.3, -0.32, up)], r: [sh[0] + fh * M.lerp(0.12, 0.3, up), sh[1] + fh * M.lerp(0.3, -0.32, up)] };
        ctx.save(); ctx.globalAlpha = Math.min(1, p2 * 3);
        M.figure(ctx, P, xr, f2, fh, { hop: M.reactHop(since, fh * 1.6), head: 'accent', hands }); ctx.restore();
      }
      keys.forEach((b) => M.underline(ctx, P, b, now.size, span(t, tNow + 0.2, tNow + 0.5), rtl));
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: P.ink, key: P.ink, each: (wd, i, box, c) => M.setDown(c, span(t, tNow + i * 0.07, tNow + 0.22 + i * 0.07), now.size) });
    },
  };
}
