// A line under the lens: the words lie on the glass, centred in the field of view, and the focus is racked onto them one after
// another (soft and faint, then sharp). The key phrase (*…*) is then measured: a pale stain spreads under it and one ring is traced
// round the whole phrase, closing with four cardinal ticks. The lead-in sits above in a lighter ink and may take two rows.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }      cut: the line holds until the joint instead of drifting out of focus.
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, L = T.lens;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = L.cx - T.textW / 2, x1 = L.cx + T.textW / 2;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: T.textW, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: T.textW - 60, minPx: T.minPx, where: 'the lead-in' }) : null;
  const gap = lead ? 26 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, L.cy);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? M.count(lead) : 0;
  const runs = M.keyRuns(line, { x0, x1, y: yLine, align: 'center' }, rtl), lk = M.lastKey(line);
  // a line that opens a reel (at < 0) is whole, ring closed, by t = 0: its timings are squeezed into the time before 0
  const n = nLead + M.count(line), budget = at < 0 ? -at - 0.05 : 2;
  const inD = Math.min(T.dur.in, budget * 0.45), ringD = Math.min(T.dur.ring, budget * 0.3);
  const step = Math.min(T.dur.step, Math.max(0.02, (budget - 0.06 - inD - ringD) / Math.max(1, n - 1)));
  const tWord = (k) => at + k * step + (lk >= 0 && k >= nLead + lk ? 0.06 : 0);
  const ringT = lk >= 0 ? tWord(nLead + lk) + inD * 0.6 : null;
  const out0 = spec.cut ? d + 1 : d - T.dur.out;
  const word = (t, off, size) => (w, i, box, c) => {
    const k = off + i, t0 = tWord(k);
    return M.focus(c, span(t, t0, t0 + inD), span(t, out0, out0 + T.dur.out), box, size, T.blur);
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, out0 + T.dur.out);
      if (ringT !== null) for (const r of runs) {
        const rx = (r.x1 - r.x0) / 2 + Math.max(18, line.space * 0.7), ry = line.size * 0.8;
        M.ring(ctx, (r.x0 + r.x1) / 2, r.y + line.size * 0.04, rx, ry, span(t, ringT, ringT + ringD), out, pal);
      }
      if (lead) kit.drawText(ctx, lead, { x0: x0 + 30, x1: x1 - 30, y: yLead, align: 'center', color: pal.lead, each: word(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: pal.ink, key: pal.key, each: word(t, nLead, line.size) });
    },
  };
}
