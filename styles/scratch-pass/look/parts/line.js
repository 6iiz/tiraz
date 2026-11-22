// A line on a paper slip carved out of the print: the slip is cut from the reading side and its cuts widen until they close; the lead-in
// (small, grey) and the statement (large, ink) then slide in word by word along the direction of travel and settle. The key word (*…*) is
// set in the one red (ink when red does not read on paper) with a tapered knife stroke under it. The landscape keeps moving behind.
// spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, pad = T.pad;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const maxW = (SAFE.right - SAFE.left) + 48 - 2 * pad.x;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const inner = Math.max(line.width, lead ? lead.width : 0), sw = inner + 2 * pad.x;
  const sx1 = rtl ? SAFE.right + 24 : SAFE.left - 24 + sw, sx0 = sx1 - sw;
  const gap = 10, sh = (lead ? lead.lead + gap : 0) + line.height + 2 * pad.y, top = spec.y ?? kit.place(sh, 700);
  const tx0 = sx0 + pad.x, tx1 = sx1 - pad.x;
  const yLead = top + pad.y + (lead ? lead.lead / 2 : 0), yLine = top + pad.y + (lead ? lead.lead + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const word = (t, off, size, keyed) => (w, i, box, c) => {
    const t0 = 0.32 + (off + i) * T.dur.step, p = span(t, t0, t0 + T.dur.in);
    if (M.arrive(c, p, size, rtl) === false) return false;
    if (w.key) M.knife(c, box.x - 6, box.x + box.width + 6, box.y + size * 0.72, 13, P.red, span(t, t0 + 0.25, t0 + 0.55), rtl);
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tl = t - at;
      M.carve(ctx, sx0, top, sx1, top + sh, span(tl, 0, T.dur.carve), P, { pitch: T.pitch, rtl });
      if (lead) kit.drawText(ctx, lead, { x0: tx0, x1: tx1, y: yLead, align: 'start', color: P.grey, each: word(tl, 0, lead.size) });
      kit.drawText(ctx, line, { x0: tx0, x1: tx1, y: yLine, align: 'start', color: P.ink, key: P.key, each: word(tl, nLead + (lead ? 1 : 0), line.size) });
    },
  };
}
