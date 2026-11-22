// A line on the town square: the lead-in (muted) and the statement stand up off the page word by word, hinged on their baselines, flush
// to the reading side. The key phrase (*…*, one or several words) gets one shop awning of the accent, unrolled down from its rail, and
// a few townsfolk stand up on the square below it, their backs to us, reading. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, minPx: 62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 46, where: 'the lead-in' }) : null;
  const gap = lead ? 22 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block + 160, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nLine = line.rows.reduce((s, r) => s + r.words.length, 0);
  const step = M.stagger(nLead + nLine, T.dur.step, T.dur.in);
  const runs = M.keyRuns(line, { x0, x1, y: yLine, align: 'start' }, rtl);
  // the onlookers stand under the key phrase (or under the end of the line)
  const r0 = runs[0], fx = r0 ? (r0.x0 + r0.x1) / 2 : (rtl ? x1 - 120 : x0 + 120), fy = top + block + 120;
  const folk = [[-46, 0, 0], [6, 14, 1], [54, -4, 3]].map(([dx, dy, c]) => ({ x: fx + dx, y: fy + dy, c: pal.coats[c] }));
  const word = (t, base) => (w, i, box, c) => { const t0 = at + (base + i) * step; if (M.unfold(c, span(t, t0, t0 + T.dur.in), box, line.size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      folk.forEach((f, k) => M.person(ctx, f.x, f.y, 1.25, f.c, pal, 0, M.E(span(t, at + 0.15 + k * 0.08, at + 0.5 + k * 0.08))));
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.muted, each: word(t, 0) });
      for (const r of runs) { const s = at + (nLead + r.first) * step; M.awning(ctx, r, line.size, span(t, s, s + 0.4), pal); }
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.onAccent, each: word(t, nLead) });
    },
  };
}
