// Before and after, as a page of notes: the old value is written in a quiet tone, then crossed out with a quick zigzag of the pen; a
// curved arrow is drawn down from it, and the new value is written below in ink, looped round, with a wash dropped behind it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 30, x1 = SAFE.right - 40, maxW = x1 - x0 - 60;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: T.weight.line, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const hL = label ? label.lead + 40 : 0, gapV = 150;
  const top = kit.place(hL + was.height + gapV + now.height, 640);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + hL + was.lead / 2, yNow = top + hL + was.height + gapV + now.lead / 2;
  const grey = pal.quiet(T.tone.grey);
  const lb = label ? M.boxes(label, { x0, x1, y: yLabel, rtl }) : [], tl = M.schedule(lb, at - 0.1, label?.size ?? 0, T.dur.perPx);
  const wb = M.boxes(was, { x0, x1, y: yWas, rtl }), tw = M.schedule(wb, at + 0.2, was.size, T.dur.perPx);
  const tCut = Math.max(at + 0.9, tw.at(-1)[1] + 0.1), tNow = tCut + 0.6;
  const nb = M.boxes(now, { x0, x1, y: yNow, rtl }), tn = M.schedule(nb, tNow, now.size, T.dur.perPx);
  const scr = was.rows.map((row, r) => { const rb = wb.filter((b) => b.row === r), a = Math.min(...rb.map((b) => b.x)), b = Math.max(...rb.map((b) => b.x + b.width)); return M.scribble(a - 10, b + 10, yWas + r * was.lead, was.size * 0.9, 81 + r, rtl); });
  const n0 = nb.filter((b) => b.row === 0), nx0 = Math.min(...n0.map((b) => b.x)), nx1 = Math.max(...n0.map((b) => b.x + b.width));
  const w0 = wb.filter((b) => b.row === was.rows.length - 1), wEdge = rtl ? Math.max(...w0.map((b) => b.x + b.width)) : Math.min(...w0.map((b) => b.x));
  const ax = rtl ? Math.max(wEdge, nx1) + 30 : Math.min(wEdge, nx0) - 30;
  const arrow = M.arrow([ax, yWas + (was.rows.length - 1) * was.lead + was.size * 0.5], [ax, yNow - now.size * 0.5], rtl ? -26 : 26, 85);
  const done = tn.at(-1)[1];
  const loop = M.loop((nx0 + nx1) / 2, yNow, (nx1 - nx0) / 2 + now.size * 0.32, now.size * 0.72, 87, rtl);
  const wash = M.patch(nx1 - nx0 + now.size * 0.3, now.size * 0.95, pal.wash, pal.washA(T.tone.wash), 89);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      M.drop(ctx, wash, nx0 - now.size * 0.15, yNow - now.size * 0.5, span(t, done + 0.3, done + 0.6), [8, -6], keep);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: grey, each: (w, i, box, c) => M.write(c, span(t, tl[i][0], tl[i][1]), out, box, label.size, rtl) });
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: grey, key: grey, each: (w, i, box, c) => M.write(c, span(t, tw[i][0], tw[i][1]), out, box, was.size, rtl) });
      ctx.save(); ctx.globalAlpha = keep;
      scr.forEach((s, r) => M.draw(ctx, s, span(t, tCut + r * 0.1, tCut + 0.3 + r * 0.1), pal.line, 4));
      M.drawAll(ctx, arrow, M.PEN(span(t, tCut + 0.3, tNow)), pal.line, 2.6);
      M.draw(ctx, loop, M.PEN(span(t, done + 0.02, done + 0.35)), pal.line, 3);
      ctx.restore();
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.ink, key: pal.ink, each: (w, i, box, c) => M.write(c, span(t, tn[i][0], tn[i][1]), out, box, now.size, rtl) });
    },
  };
}
