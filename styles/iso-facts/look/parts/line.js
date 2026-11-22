// A line as a data panel pinned to the little world: a leader shoots up from the top of the accent tower on the board, a panel pops
// open at its tip, and the lead-in (muted, may take two rows) and the statement settle into it word by word. The key phrase (*…*, one
// or several words) sits on one accent marker. At the end the panel folds back into its pin.
// spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const pad = T.panel.pad, x0 = SAFE.left, x1 = SAFE.right, ix0 = x0 + pad, ix1 = x1 - pad, maxW = ix1 - ix0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, minPx: 62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 46, where: 'the lead-in' }) : null;
  const gap = lead ? 8 : 0, inner = (lead ? lead.height + gap : 0) + line.height, cardH = T.panel.top + inner + pad * 0.7;
  const y0 = spec.y ?? kit.place(cardH, 600), y1 = y0 + cardH;
  const yLead = y0 + T.panel.top + (lead ? lead.lead / 2 : 0), yLine = y0 + T.panel.top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? M.words(lead) : 0, n = nLead + M.words(line);
  const step = M.stagger(n, T.dur.step, T.dur.in, 0.47);
  const runs = M.keyRuns(line, { x0: ix0, x1: ix1, y: yLine, align: 'start' }, rtl);
  const word = (t, base) => (w, i, box, c) => { const s = at + 0.28 + (base + i) * step; if (M.settle(c, span(t, s, s + T.dur.in), box) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pin = ground.at(5.9, 8.1, 3.6, t), out = M.OUT(span(t, d - T.dur.out, d));
      const top = [pin[0], y1];
      M.leader(ctx, pin, top, span(t, at, at + 0.25) * (1 - out), pal);
      ctx.save();
      if (M.pop(ctx, M.Q(span(t, at + 0.16, at + 0.46)) * (1 - out), top[0], top[1]) === false) { ctx.restore(); return; }
      M.panel(ctx, x0, y0, x1, y1, pal, rtl);
      if (lead) kit.drawText(ctx, lead, { x0: ix0, x1: ix1, y: yLead, align: 'start', color: pal.muted, each: word(t, 0) });
      for (const r of runs) { const s = at + 0.28 + (nLead + r.first) * step + 0.06; M.marker(ctx, r, line.size, span(t, s, s + 0.24), pal, rtl); }
      kit.drawText(ctx, line, { x0: ix0, x1: ix1, y: yLine, align: 'start', color: pal.ink, key: pal.onAccent, each: word(t, nLead) });
      ctx.restore();
    },
  };
}
