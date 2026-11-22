// A line as a stutter of title cards: each row of the statement sits on a hard paper field that runs in from the reading edge of the
// frame; the words cut in one by one after uneven gaps of a few frames; the key phrase (*…*) cuts in on one accent block, after a
// slightly longer hold. Behind, a giant tonal copy of the newest word fills the frame, and while the line holds it changes on every
// beat (the strobe). The lead-in sits above with a short accent rail at the reading edge. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, room: 'corridor' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, rtl = kit.rtl;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.7, minPx: 64 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 40, minScale: 0.92, minPx: 44, where: 'the lead-in' }) : null;
  const gapL = lead ? 46 : 0, block = (lead ? lead.height + gapL : 0) + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gapL : 0) + line.lead / 2;
  const n = line.rows.reduce((s, r) => s + r.words.length, 0);
  const runs = M.keyRuns(kit, line, { x0, x1, y: yLine }), keyIdx = runs.length ? runs[0].first : -1;
  const wt = M.cuts(n, at + 0.1, T, keyIdx), done = wt[n - 1];
  const boxes = M.rowBoxes(kit, line, x0, x1, yLine);
  const rowFirst = []; { let i = 0; for (const r of line.rows) { rowFirst.push(i); i += r.words.length; } }
  const giants = M.giantsOf(kit, spec.says.text, T, brand.fonts.display.family);
  const keyGiant = keyIdx >= 0 ? Math.min(keyIdx, giants.length - 1) : -1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, t / d);
      const off = M.gone(t, d, line.rows.length + (lead ? 1 : 0), T);
      // the strobe: before the line is complete, the newest word; after, one word per beat, starting from the key
      let which = -1;
      for (let i = 0; i < n; i++) if (t >= wt[i]) which = Math.min(i, giants.length - 1);
      if (t >= done + 0.2) which = (Math.max(0, keyGiant) + 1 + Math.floor((t - done - 0.2) / T.beat)) % giants.length;
      if (off === 0) M.ghost(ctx, kit, W, giants, which, which === keyGiant ? pal.ghostKey : pal.ghost);
      line.rows.forEach((_, r) => { if (line.rows.length - 1 - r >= off) M.field(ctx, W, boxes[r], line.size, M.opens(t, wt[rowFirst[r]] - 2 * T.frame, T), pal.paper, rtl); });
      for (const run of runs) if (t >= wt[run.first] && line.rows.length - 1 - run.row >= off) M.block(ctx, run, line, pal.accent);
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.onAccent,
        each: (w, i, box) => { if (t < wt[i] || line.rows.length - 1 - box.row < off) return false; } });
      if (lead && off <= line.rows.length) {
        const lt = at;
        if (t >= lt) {
          const rh = lead.height - lead.lead * 0.3; ctx.fillStyle = pal.accent;
          ctx.fillRect(rtl ? W - 34 : 0, top + lead.lead * 0.15, 34, rh);
          kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.paper });
        }
      }
    },
  };
}
