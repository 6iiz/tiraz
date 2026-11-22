// A line inked on the glass: faint construction rules are laid first, then the stylus writes the lead-in (small, grey) and the statement
// (large, glowing) word by word from the reading side; when the statement is done it goes back and draws one glowing lasso around the
// key phrase, which is inked in the accent. Then the tip lifts and hovers. spec: { duration, at?, y?, cut?, says: { text, lead? } }
// (cut is accepted and changes nothing: the joint always moves the whole canvas away.)
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.7 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 1, where: 'the lead-in' }) : null;
  const gap = lead ? 22 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 680);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const lw = lead ? M.layout(kit, lead, { x0, x1, y: yLead }) : [], sw = M.layout(kit, line, { x0, x1, y: yLine });
  const all = [...lw, ...sw], n = all.length;
  let total = Math.min(1.5, 0.25 + 0.12 * n); if (at < 0) total = Math.min(total, -at - 0.5);
  const sched = M.schedule(all, at, total), end = sched.at(-1).t1;
  const R = M.runs(sw), loops = R.map((r, i) => ({ S: M.lasso(r, 31 + i * 7, rtl), t0: end + 0.06 + i * (T.dur.lasso + 0.05) }));
  loops.forEach((l) => { l.t1 = l.t0 + T.dur.lasso; });
  const events = [...all.map((w, i) => ({ t0: sched[i].t0, t1: sched[i].t1, word: { box: w, size: w.size, rtl } })), ...loops].sort((a, b) => a.t0 - b.t0);
  const glow = rgba(pal.light, 0.45), keyGlow = rgba(pal.accent, 0.55);
  const rowsY = [...(lead ? lead.rows.map((_, r) => [yLead + r * lead.lead, lead.size]) : []), ...line.rows.map((_, r) => [yLine + r * line.lead, line.size])];
  const each = (t, base, size) => (w, i, box, c) => { const s = sched[base + i]; return M.inkWord(c, span(t, s.t0, s.t1), box, size, rtl, w.key ? keyGlow : glow); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      rowsY.forEach(([y, s], k) => M.guide(ctx, x0, x1, y + s * 0.62, span(t, at - 0.25 + k * 0.05, at + 0.15 + k * 0.05), pal, rtl));
      for (const l of loops) M.ink(ctx, l.S, span(t, l.t0, l.t1), T.pen.lasso, pal.key, pal.accent);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.grey, key: pal.key, each: each(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.light, key: pal.key, each: each(t, lw.length, line.size) });
      const pt = M.tipPath(events, t); if (pt) M.tip(ctx, pt, pal, pt.alpha ?? 1);
    },
  };
}
