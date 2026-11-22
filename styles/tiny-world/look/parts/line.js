// A line on a rooftop of the model town: the roof rises out of the street in four time-lapse steps, then the words are set down on it
// one by one like model pieces (a beat too big, then sitting), the lead-in muted above the statement. The key phrase (*…*, one or
// several words) sits on one painted tarp of the brand's accent, unrolled from the reading side. Only the band of this roof is in focus.
// spec: { duration, at?, y?, says: { text, lead? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 36, x1 = SAFE.right - 36, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, minPx: 62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 46, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, block = (lead ? lead.height + gap : 0) + line.height, pad = 50;
  const top = spec.y ?? kit.place(block, 680);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const roof = { x: 44, y: top - pad, w: W - 88, h: block + pad * 2 };
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nLine = line.rows.reduce((s, r) => s + r.words.length, 0);
  const w0 = at + 0.24, step = M.stagger(nLead + nLine, T.dur.step, 0.22, 0.75 - 0.24);
  const runs = M.keyRuns(line, { x0, x1, y: yLine, align: 'start' }, rtl);
  const band = { y: roof.y + roof.h / 2 - 13, h: roof.h + 30 };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, band);
      ctx.save();
      if (M.slab(ctx, roof, pal, (M.lapse(t) - at) / 0.24)) {
        if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.muted, each: (w, i, box, c) => M.setDown(c, t, w0 + i * step, box) });
        for (const r of runs) { const s = w0 + (nLead + r.first) * step - 0.05; M.tarp(ctx, r, line.size, (M.lapse(t) - s) / 0.2, pal, rtl); }
        kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.onAccent, each: (w, i, box, c) => M.setDown(c, t, w0 + (nLead + i) * step, box) });
      }
      ctx.restore();
    },
  };
}
