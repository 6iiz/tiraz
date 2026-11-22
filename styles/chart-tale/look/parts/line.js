// A line as a note on the chart: a stem climbs from the point the pencil is drawing, and at its top the lead-in (muted, may take two
// rows) and the statement are written on word by word from the reading side. The key phrase (*…*, one or several words) is circled
// once by hand in the accent. The note is erased upward at the end. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 50, minScale: 0.6, minPx: 62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 46, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 600), bottom = top + block + 26;
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const lx0 = x0 + 25, lx1 = x1 - 25;
  const nLead = lead ? M.words(lead) : 0, n = nLead + M.words(line);
  const step = M.stagger(n, T.dur.step, T.dur.in, 0.5), w0 = at + 0.12;
  const runs = M.keyRuns(line, { x0: lx0, x1: lx1, y: yLine, align: 'start' }, rtl);
  const out = (t) => span(t, d - T.dur.out, d);
  const word = (t, base, size) => (w, i, box, c) => {
    const s = w0 + (base + i) * step; if (M.write(c, span(t, s, s + T.dur.in), box, size, rtl) === false) return false;
    if (M.erase(c, out(t)) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { pen: false });
      const o = out(t);
      M.stem(ctx, ground.tip(t), bottom, span(t, at, at + 0.3) * (1 - M.OUT(o)), pal);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.muted, each: word(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0: lx0, x1: lx1, y: yLine, align: 'start', color: pal.ink, key: pal.keyText, each: word(t, nLead, line.size) });
      for (const r of runs) {
        const s = Math.min(at + 0.5, w0 + (nLead + r.last) * step + T.dur.in * 0.6);
        ctx.save(); if (M.erase(ctx, o) !== false) M.loop(ctx, r, line.size, span(t, s, s + 0.3), pal.line, r.first); ctx.restore();
      }
      ground.pen(ctx, t);
    },
  };
}
