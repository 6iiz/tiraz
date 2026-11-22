// A line written on the sketchbook page: the lead-in is written small in a quiet tone, then the statement is written word by word in the
// reading direction, flush to the reading side. The key word (*…*) is looped round by the pen, and a moment later a dab of the brand's
// colour is dropped behind it, a little off the loop. spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 30, x1 = SAFE.right - 40, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? 40 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 620);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const lb = lead ? M.boxes(lead, { x0, x1, y: yLead, rtl }) : [], bx = M.boxes(line, { x0, x1, y: yLine, rtl });
  const tl = M.schedule(lb, at < 0 ? at * 2 : at, lead?.size ?? 0, T.dur.perPx * 1.2), tLine = lb.length ? tl.at(-1)[1] + 0.1 : at;
  const tw = M.schedule(bx, tLine, line.size, T.dur.perPx);
  const keys = M.keySpans(bx).map((s, k) => {
    const cx = (s.x0 + s.x1) / 2, rx = (s.x1 - s.x0) / 2 + line.size * 0.2, ry = line.size * 0.64, t0 = tw[s.last][1] + 0.05;
    return { L: M.loop(cx, s.y + line.size * 0.04, rx, ry, 40 + k, rtl), P: M.patch(s.x1 - s.x0 + line.size * 0.3, line.size * 0.95, pal.wash, pal.washA(T.tone.wash), 50 + k),
      x: s.x0 - line.size * 0.15, y: s.y - line.size * 0.5, t0 };
  });
  const out0 = d - T.dur.out, grey = pal.quiet(T.tone.grey);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), keep = 1 - M.I(out);
      for (const K of keys) M.drop(ctx, K.P, K.x, K.y, span(t, K.t0 + 0.3, K.t0 + 0.6), [7, -5], keep);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: grey, each: (w, i, box, c) => M.write(c, span(t, tl[i][0], tl[i][1]), out, box, lead.size, rtl) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.ink, each: (w, i, box, c) => M.write(c, span(t, tw[i][0], tw[i][1]), out, box, line.size, rtl) });
      ctx.save(); ctx.globalAlpha = keep; for (const K of keys) M.draw(ctx, K.L, M.PEN(span(t, K.t0, K.t0 + 0.35)), pal.line, 3); ctx.restore();
    },
  };
}
