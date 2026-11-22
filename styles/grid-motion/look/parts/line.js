// A line as kinetic type: the lead-in, a heavy ink bar and the statement in giant heavy type, each row on its own track. Rows shoot in
// from alternating sides a few frames apart and stop dead flush to the reading side; the key phrase (*…*) rides on one solid ink slab
// and is set in the ground's colour. At the end the rows carry on through the frame the way they came. Under the frame the key phrase
// crawls by again as giant tonal type. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.88, where: 'the lead-in' }) : null;
  const barH = 16, gapA = lead ? 26 : 0, gapB = 40;
  const block = (lead ? lead.height + gapA : 0) + barH + gapB + line.height;
  const G = T.grid.row, top = Math.max(SAFE.top, Math.min(SAFE.bottom - block, Math.round((spec.y ?? kit.place(block, 740)) / G) * G));
  const yLead = top + (lead ? lead.lead / 2 : 0), yBar = top + (lead ? lead.height + gapA : 0), yLine = yBar + barH + gapB + line.lead / 2;
  const boxes = M.layout(kit, line, { x0, x1, y: yLine }), runs = M.keyRuns(boxes);
  // the tracks, in the order they arrive: lead rows, the bar, the statement's rows
  const nLeadRows = lead ? lead.rows.length : 0, n = nLeadRows + 1 + line.rows.length;
  const step = Math.min(T.dur.row, 0.3 / Math.max(1, n - 1)), slide = Math.min(T.dur.slide, 0.7 - step * (n - 1));
  const out0 = d - T.dur.out - 0.04 * (n - 1);
  const dx = (t, g) => M.travel(W, span(t, at + g * step, at + g * step + slide), span(t, out0 + g * 0.04, out0 + g * 0.04 + T.dur.out), M.rowDir(g, rtl));
  const keyText = boxes.some((b) => b.key) ? line.rows.flatMap((r) => r.words).filter((w) => w.key).map((w) => w.w).join(' ') : spec.says.text.replace(/\*/g, '');
  const ghost = kit.fit(keyText, { size: T.size.ghost, weight: 900, maxW: 99999, single: true, overflow: true, where: 'the ghost type' });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.ticker(ctx, kit, ghost, t + clock, { W, y: 1600, color: pal.ghost, speed: T.ticker });
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.ink,
        each: (w, i, box, c) => { const o = dx(t, box.row); if (o === null) return false; c.translate(o, 0); } });
      const ob = dx(t, nLeadRows);
      if (ob !== null) { ctx.fillStyle = pal.ink; ctx.fillRect(x0 + ob, yBar, maxW, barH); }
      for (const run of runs) {
        const o = dx(t, nLeadRows + 1 + run.row); if (o === null) continue;
        ctx.save(); ctx.translate(o, 0); M.slab(ctx, run, line.size, line.space, pal.ink); ctx.restore();
      }
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.ground,
        each: (w, i, box, c) => { const o = dx(t, nLeadRows + 1 + box.row); if (o === null) return false; c.translate(o, 0); } });
    },
  };
}
