// Before and after, as a corrected note: the old value is written in the soft pencil, then struck through by two ruled pencil lines;
// a curved pencil arrow is drawn down from it, and the new value is written large in graphite on a patch of coloured-pencil hatching,
// boxed in a pencilled frame. Values may be words or numbers. Rubbed out at the end.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const full = SAFE.right - SAFE.left;
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.8, weight: T.weight.line, maxW: full - 140, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: T.weight.line, maxW: full - 140, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 20, single: true, where: 'the compare label' }) : null;
  const lh = label ? label.lead + 20 : 0, arrowH = 150;
  const top = kit.place(lh + was.height + arrowH + now.height + 60, 700);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lh + was.lead / 2, yNow = top + lh + was.height + arrowH + 30 + now.lead / 2;
  const sl = label ? M.schedule(label, at, T.write.lead) : null;
  const sw = M.schedule(was, (sl ? sl.end : at) + 0.05, T.write.line);
  const tStrike = sw.end + 0.05, tArrow = tStrike + 0.35, sn = M.schedule(now, tArrow + 0.3, T.write.line);
  const wx0 = rtl ? SAFE.right - was.width : SAFE.left, wx1 = wx0 + was.width;
  const strikes = [0, 1].map((j) => M.wobble([rtl ? wx1 + 14 : wx0 - 14, yWas - 4 + j * 16], [rtl ? wx0 - 14 : wx1 + 14, yWas - 10 + j * 16], 600 + j, 2.2));
  const ax = rtl ? SAFE.right - 60 : SAFE.left + 60, a0 = [ax, yWas + was.lead / 2 + 4], a1 = [ax + (rtl ? -30 : 30), yNow - now.lead / 2 - 4];
  const arrow = [], s = rtl ? -1 : 1;
  for (let i = 0; i <= 12; i++) { const f = i / 12; arrow.push([a0[0] + (a1[0] - a0[0]) * f - s * Math.sin(f * Math.PI) * 50, a0[1] + (a1[1] - a0[1]) * f]); }
  const head = [[a1[0] - 18, a1[1] - 22], a1, [a1[0] + 18, a1[1] - 22]];
  const nx0 = rtl ? SAFE.right - now.width - 40 : SAFE.left, nx1 = nx0 + now.width + 40, nh = now.height + 10;
  const hatch = M.hatchStrokes(now.width + 60, nh, { angle: rtl ? -0.95 : -2.2, gap: 4.5, len: 34, seed: 610, rtl });
  const frame = [M.wobble([nx1 + 8, yNow - now.lead / 2 - 4], [nx0 - 8, yNow - now.lead / 2 - 2], 620, 2), M.wobble([nx0 - 8, yNow - now.lead / 2 - 10], [nx0 - 4, yNow + now.height - now.lead / 2 + 8], 621, 2),
    M.wobble([nx0 - 12, yNow + now.height - now.lead / 2 + 4], [nx1 + 10, yNow + now.height - now.lead / 2 + 6], 622, 2), M.wobble([nx1 + 4, yNow + now.height - now.lead / 2 + 12], [nx1 + 8, yNow - now.lead / 2 - 10], 623, 2)];
  if (rtl) frame.forEach((f) => f.reverse());
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - T.dur.out, d), keep = 1 - Math.min(1, q * 1.4);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: P.soft,
        each: (w, k, box, c) => M.write(c, t, sl.at(k), box, label.size, rtl, q, 0, 3) });
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start', color: P.soft, key: P.soft,
        each: (w, k, box, c) => M.write(c, t, sw.at(k), box, was.size, rtl, q, 1, 3) });
      ctx.save(); ctx.globalAlpha = keep;
      strikes.forEach((st, j) => M.pencil(ctx, st, span(t, tStrike + j * 0.15, tStrike + 0.2 + j * 0.15), P.graphite, 3.2));
      M.pencil(ctx, arrow, span(t, tArrow, tArrow + 0.3), P.graphite, 2.6);
      M.pencil(ctx, head, span(t, tArrow + 0.3, tArrow + 0.4), P.graphite, 2.6);
      const hp = span(t, tArrow + 0.2, tArrow + 0.6);
      M.drawHatch(ctx, hatch, nx0 - 10, yNow - now.lead / 2 + 2, hp, P.pen);
      frame.forEach((f, j) => M.pencil(ctx, f, span(t, sn.end + j * 0.1, sn.end + 0.12 + j * 0.1), P.graphite, 2.4));
      ctx.restore();
      kit.drawText(ctx, now, { x0: SAFE.left + (rtl ? 0 : 20), x1: SAFE.right - (rtl ? 20 : 0), y: yNow, align: 'start', color: P.graphite, key: P.graphite,
        each: (w, k, box, c) => M.write(c, t, sn.at(k), box, now.size, rtl, q, 2, 3) });
    },
  };
}
