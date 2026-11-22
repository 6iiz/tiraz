// Before and after, painted and lifted: the old value develops in a quiet tone on a grey wash; then a stroke of clean, wet paper is
// brushed across it in the reading direction and lifts most of it away, leaving a ghost. The new value develops below it, on a strong
// stroke of the pigment, with drops flicked off the brush. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0 - 80;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: T.weight.line, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const hL = label ? label.lead + 50 : 0, gapV = 110;
  const top = kit.place(hL + was.height + gapV + now.height, 640);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + hL + was.lead / 2, yNow = top + hL + was.height + gapV + now.lead / 2;
  const grey = pal.quiet(T.tone.grey), keyInk = pal.on(pal.tint(0.75));
  const mk = (f, y, color, alpha, seed) => f.rows.map((row, r) => {
    const w = row.width + f.size * 0.7, x = (x0 + x1 - row.width) / 2 - f.size * 0.35;
    return { B: M.band(w, f.size * 1.4, color, alpha, seed + r, rtl), x, w, y: y + r * f.lead };
  });
  const wasB = mk(was, yWas, pal.ink, 0.16, 5), lift = mk(was, yWas, pal.paper, T.tone.lift, 9), nowB = mk(now, yNow, pal.accent, T.tone.key, 13);
  const wb = M.boxes(was, { x0, x1, y: yWas, rtl }), nb = M.boxes(now, { x0, x1, y: yNow, rtl });
  const tW = at + 0.2, tCut = at + 0.95, tNow = at + 1.45;
  const wasT = wb.map((b) => { const B = wasB[b.row]; return M.passTime(b, B.x, B.x + B.w, tW, tW + T.dur.pass, rtl); });
  const nowT = nb.map((b) => { const B = nowB[b.row]; return M.passTime(b, B.x, B.x + B.w, tNow, tNow + T.dur.pass * 0.8, rtl); });
  const D = M.drops(33, 8, rtl ? nowB[0].x - 10 : nowB[0].x + nowB[0].w + 10, yNow, 80);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, color: grey,
        each: (w, i, box, c) => M.develop(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.dry), out, pal.wet, grey) });
      for (const B of wasB) M.lay(ctx, B.B, B.x, B.y, M.BR(span(t, tW, tW + T.dur.pass)), rtl, keep);
      kit.drawText(ctx, was, { x0, x1, y: yWas, color: grey, key: grey,
        each: (w, i, box, c) => M.develop(c, span(t, wasT[i], wasT[i] + T.dur.dry), out, pal.wet, grey) });
      for (const B of lift) M.lay(ctx, B.B, B.x, B.y, M.BR(span(t, tCut, tCut + 0.4)), rtl, keep, 'source-over');
      for (const B of nowB) M.lay(ctx, B.B, B.x, B.y, M.BR(span(t, tNow, tNow + T.dur.pass * 0.8)), rtl, keep);
      M.splash(ctx, D, span(t, tNow + T.dur.pass * 0.8 - 0.05, tNow + T.dur.pass * 0.8 + 0.25) * keep, pal.accent);
      kit.drawText(ctx, now, { x0, x1, y: yNow, color: keyInk, key: keyInk,
        each: (w, i, box, c) => M.develop(c, span(t, nowT[i], nowT[i] + T.dur.dry), out, pal.wet, keyInk) });
    },
  };
}
