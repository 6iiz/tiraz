// A line as a plate caption on the print: the lead-in in a softer white, the statement large and centred, and under it a dimension
// line with drawn arrowheads measuring the statement. A front of rinse water passes down the sheet and each row develops from the
// print colour to white as the front reaches it. The key phrase (*…*) is where a paper mask lay: one white patch for the whole run,
// the words on it in the print colour. At the end the marks wash back into the coating, top row first.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0 - 20;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, dimGap = 64;
  const block = (lead ? lead.height + gap : 0) + line.height + dimGap;
  const top = spec.y ?? kit.place(block, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const boxes = M.layout(kit, line, { x0, x1, y: yLine, align: 'center' }), runs = M.keyRuns(boxes);
  const xa = Math.min(...boxes.map((b) => b.x)), xb = Math.max(...boxes.map((b) => b.x + b.width));
  const yDim = yLine + line.height - line.lead / 2 + 18, yExt = yDim - 34;
  // the front runs from above the block to below it; a mark at y develops when the front reaches it
  const fA = top - 120, fB = yDim + 140, front = (t) => lerp(fA, fB, span(t, at, at + T.dur.front));
  const devAt = (y) => at + T.dur.front * (y - fA) / (fB - fA);
  const dev = (t, y) => M.DEV(span(t, devAt(y), devAt(y) + T.dur.dev));
  const gone = (t, y) => M.WASH(span(t, d - T.dur.out + (y - top) / 4000, d));
  const lvl = (t, y) => dev(t, y) * (1 - gone(t, y));
  const band = M.makeWash(W, pal);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fy = front(t); if (fy < fB) M.drawWash(ctx, band, fy);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'center', color: pal.soft,
        each: (w, i, box) => { const p = lvl(t, box.y); if (p <= 0) return false; return M.tone(pal, p, pal.soft); } });
      for (const run of runs) {
        const p = lvl(t, run.y), pad = line.space * 0.5;
        M.mask(ctx, pal, run.x0 - pad, run.y - line.size * 0.62, run.x1 + pad, run.y + line.size * 0.66, p, 11 + run.first);
      }
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: pal.white, key: pal.coat,
        each: (w, i, box, c) => { const p = lvl(t, box.y); if (p <= 0) return false; c.translate(0, (1 - p) * 8); if (w.key) return pal.coat; return M.tone(pal, p); } });
      const pd = lvl(t, yDim);
      if (pd > 0) M.dimension(ctx, xa, xb, yExt, yDim, pd, M.tone(pal, pd, pal.soft));
    },
  };
}
