// A line, set like an editorial page: the lead small in grey, the statement large in ink, flush to the reading side with plenty of
// paper around it. Words are set down one by one; the key word (*…*) gets an accent underline drawn from the reading side. Below, the
// people on the system line reach for each other's hands, join into one line, and the accent runs through their arms from the one with
// the accent head; each person hops as it reaches them, then they lift their joined hands.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut changes nothing: the pan joint carries every scene out)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.9, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, block = (lead ? lead.height : 0) + gap + line.height + 40;
  const top = spec.y ?? kit.place(block, 660);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, n = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const fast = at < 0, step = fast ? Math.min(0.08, (-at - 0.45) / Math.max(1, n)) : Math.min(0.15, 1.1 / Math.max(1, n)), dur = fast ? 0.14 : 0.22;
  const tW = (i) => at + 0.05 + i * step + (i >= nLead && lead ? 0.06 : 0), tDone = tW(n - 1) + dur, tU = tDone + (fast ? 0 : 0.05);
  const keys = M.keySpans(line, { x0, x1, y: yLine, align: 'start' }, rtl);
  // the crowd: hands join after the line is set (never before the scene starts), then the run, then the lift
  const tJ = Math.max(tDone, 0.1), runT = [tJ + 0.45, tJ + 0.45 + Math.min(1.3, Math.max(0.7, d - tJ - 1.3))];
  const word = (t, base, size) => (w, i, box, c) => M.setDown(c, span(t, tW(base + i), tW(base + i) + dur), size);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ground.crowd(ctx, t, { join: span(t, tJ, tJ + 0.4), runP: span(t, runT[0], runT[1]), runT, lift: M.ease.inOutCubic(span(t, runT[1] + 0.1, runT[1] + 0.5)) });
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.note, key: P.ink, each: word(t, 0, lead.size) });
      keys.forEach((b) => M.underline(ctx, P, b, line.size, span(t, tU, tU + (fast ? 0.2 : 0.3)), rtl));
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.ink, key: P.ink, each: word(t, nLead, line.size) });
    },
  };
}
