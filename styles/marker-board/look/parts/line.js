// A line on the white board: the floating marker flies in, writes an optional lead in a lighter hand, then the statement, word by word
// from the reading side; the key word (*…*) is written with the accent marker, and once the line is done the marker throws a loose ring
// round it and flies off. spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut changes nothing: the camera always travels on)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at: the line is already up when the reel opens, so its entrance is placed far in the past and is whole at frame 0
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? 30 : 0, block = (lead ? lead.height + gap : 0) + line.height, top = spec.y ?? kit.place(block, 620);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const t0 = at + 0.1, tl = lead ? t0 + T.write.lead + 0.12 : t0, te = tl + T.write.line;
  const sLead = lead ? M.schedule(lead, t0, t0 + T.write.lead, T.write.word) : [], sLine = M.schedule(line, tl, te, T.write.word);
  const bLead = lead ? M.layout(lead, { x0, x1, y: yLead }, rtl) : [], bLine = M.layout(line, { x0, x1, y: yLine }, rtl);
  const jobs = [...bLead.map((b, i) => M.wordJob(b, sLead[i].s, sLead[i].e, P.ink)), ...bLine.map((b, i) => M.wordJob(b, sLine[i].s, sLine[i].e, b.key ? P.accent : P.ink))];
  const rings = []; let tr = te + 0.1;
  bLine.forEach((b, i) => { if (!b.key) return; const pts = M.ring(200 + i, b.x + b.width / 2, b.y + 4, b.width / 2 + 34, line.size * 0.72); rings.push({ pts, s: tr, e: tr + 0.36 }); jobs.push(M.pathJob(pts, tr, tr + 0.36, P.accent)); tr += 0.42; });
  const each = (t, sched, size) => (w, i, box, c) => { if (M.write(c, span(t, sched[i].s, sched[i].e), box, size, w.arabic) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ink = M.ink(ctx, P.ink, P.board), soft = M.ink(ctx, P.soft, P.board, 6), acc = M.ink(ctx, P.accent, P.board, 7);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: soft, key: acc, each: each(t, sLead, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: ink, key: acc, each: each(t, sLine, line.size) });
      for (const r of rings) M.trace(ctx, r.pts, span(t, r.s, r.e), T.pen.line, acc);
      M.drawPen(ctx, M.penAt(jobs, t, W, rtl), P, rtl);
    },
  };
}
