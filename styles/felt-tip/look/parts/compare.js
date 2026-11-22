// Before and after, worked on the sheet: the old value is lettered in the grey marker, then scribbled out with a black zigzag (where
// the black crosses the grey it goes darker); a hand arrow is drawn down, and the new value is lettered big in black and underlined
// twice with the coloured marker, the second stroke crossing the first. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const full = SAFE.right - SAFE.left;
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.78, weight: T.weight.line, maxW: full - 60, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: T.weight.line, maxW: full - 60, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 20, single: true, where: 'the compare label' }) : null;
  const lh = label ? label.lead + 20 : 0, arrowH = 150;
  const top = kit.place(lh + was.height + arrowH + now.height + 40, 700);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lh + was.lead / 2, yNow = top + lh + was.height + arrowH + now.lead / 2;
  const sl = label ? M.schedule(label, at, T.write.lead) : null;
  const sw = M.schedule(was, (sl ? sl.end : at) + 0.05, T.write.line);
  const tOut = sw.end + 0.1, tArrow = tOut + 0.4, sn = M.schedule(now, tArrow + 0.3, T.write.line);
  const wx0 = rtl ? SAFE.right - was.width : SAFE.left, wx1 = wx0 + was.width, wh = was.size * 0.5;
  const scrib = []; { const n = Math.max(4, Math.round(was.width / 70)); for (let i = 0; i <= n; i++) { const f = i / n, x = rtl ? wx1 + 10 - f * (was.width + 20) : wx0 - 10 + f * (was.width + 20); scrib.push([x + (i % 2 ? 14 : -14), yWas + (i % 2 ? wh * 0.35 : -wh * 0.4)]); } }
  const ax = rtl ? SAFE.right - 70 : SAFE.left + 70, arrow = M.hand([ax, yWas + was.lead / 2 + 2], [ax + (rtl ? -24 : 24), yNow - now.lead / 2 - 6], 71, 10);
  const tip = arrow[arrow.length - 1], head = [[tip[0] - 18, tip[1] - 22], tip, [tip[0] + 18, tip[1] - 20]];
  const nx0 = rtl ? SAFE.right - now.width : SAFE.left, nx1 = nx0 + now.width, uy = yNow + now.height - now.lead / 2 + 4;
  const unders = [M.hand([rtl ? nx1 + 10 : nx0 - 10, uy - 10], [rtl ? nx0 - 20 : nx1 + 20, uy - 4], 72, 3), M.hand([rtl ? nx1 - 10 : nx0 + 10, uy + 14], [rtl ? nx0 - 10 : nx1 + 10, uy + 2], 73, 3)];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: P.grey, each: (w, j, b, c) => M.letter(c, t, sl.at(j), w, b, label, P.grey, rtl) });
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start', color: P.grey, key: P.grey, each: (w, j, b, c) => M.letter(c, t, sw.at(j), w, b, was, P.grey, rtl) });
      M.marker(ctx, scrib, span(t, tOut, tOut + 0.3), P.ink, T.pen.thin);
      M.marker(ctx, arrow, span(t, tArrow, tArrow + 0.2), P.ink, T.pen.thin);
      M.marker(ctx, head, span(t, tArrow + 0.2, tArrow + 0.3), P.ink, T.pen.thin);
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow, align: 'start', color: P.ink, key: P.ink, each: (w, j, b, c) => M.letter(c, t, sn.at(j), w, b, now, P.ink, rtl) });
      unders.forEach((u, j) => M.marker(ctx, u, span(t, sn.end + j * 0.18, sn.end + 0.18 + j * 0.18), P.pen, T.pen.line));
    },
  };
}
