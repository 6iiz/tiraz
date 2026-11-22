// A line: an optional muted lead-in and the statement, set flush to the reading side above the dive. Each word comes up out of the
// vanishing point, small and far, and grows into its place; the key phrase (*…*, one or several words) is then locked on by one
// next-stop pill of the pointer colour with a dashed ring crawling round it. At the end the whole frame rushes past the lens.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 40, minScale: 0.6, minPx: 64, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 46, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nLine = line.rows.reduce((s, r) => s + r.words.length, 0);
  const step = M.stagger(nLead + nLine, T.dur.step, T.dur.in);
  const lx0 = x0, lx1 = x1 - 20;                                       // the statement sits a little in, so its pill has room
  const runs = M.keyRuns(line, { x0: lx0, x1: lx1, y: yLine, align: 'start' }, rtl);
  const word = (t, base) => (w, i, box, c) => { const t0 = at + (base + i) * step; if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, ground.vx, ground.vy) === false) return false; if (w.key) return t >= t0 + 0.2 ? pal.onSun : pal.ink; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save();
      if (M.rushOut(ctx, span(t, d - T.dur.out, d), ground.vx, ground.vy * 0.6)) {
        if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.muted, each: word(t, 0) });
        for (const r of runs) { const t0 = at + (nLead + r.first) * step + 0.06; M.stop(ctx, r, line.size, span(t, t0, t0 + 0.42), pal, t + clock); }
        kit.drawText(ctx, line, { x0: lx0, x1: lx1, y: yLine, align: 'start', color: pal.ink, key: pal.onSun, each: word(t, nLead) });
      }
      ctx.restore();
    },
  };
}
