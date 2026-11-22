// A line carried by the wind: the threads part round each row of the text, and the words arrive on the flow from the reading side,
// one after another, slowing as they settle into their calm. Under the key phrase (*…*) one gust in the accent is drawn on from
// upwind, and the strokes running past the phrase turn the same colour. The lead-in is a paler ink above and may take two rows.
// At the end the words are carried off downwind. spec: { duration, at?, y?, cut?, says: { text, lead? } }   cut: hold to the joint.
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: T.minPx, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 720);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const LA = lead && M.layout(lead, { x0, x1, y: yLead }, rtl), LN = M.layout(line, { x0, x1, y: yLine }, rtl);
  const obstacles = [...(LA ? LA.rows.map((r) => M.calm(r, lead.size)) : []), ...LN.rows.map((r) => M.calm(r, line.size))];
  const TH = ground.threads(obstacles, 17);
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, n = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  let lk = -1, k0 = 0; for (const r of line.rows) for (const w of r.words) { if (w.key) lk = k0; k0++; }
  const budget = at < 0 ? -at - 0.05 : 2;
  const inD = Math.min(T.dur.in, budget * 0.45), ribD = Math.min(T.dur.ribbon, budget * 0.3);
  const step = Math.min(T.dur.step, Math.max(0.015, (budget - inD * 0.7 - ribD - 0.05) / Math.max(1, n - 1)));
  const ribT = lk >= 0 ? at + (nLead + lk) * step + inD * 0.6 : null;
  const out0 = spec.cut ? d + 1 : d - T.dur.out;
  const word = (t, off) => (w, i, box, c) => { const t0 = at + (off + i) * step; return M.blow(c, span(t, t0, t0 + inD), span(t, out0, out0 + T.dur.out), rtl, T.drift); };
  return {
    duration: d,
    draw(ctx, t) {
      const out = span(t, out0, out0 + T.dur.out), rib = ribT === null ? 0 : span(t, ribT, ribT + ribD);
      const gusts = LN.runs.map((r) => ({ cx: (r.x0 + r.x1) / 2, cy: r.y, a: (r.x1 - r.x0) / 2 + 160, b: line.size * 1.3, k: rib * (1 - out) }));
      ground.draw(ctx, t, TH, { gusts });
      for (const r of LN.runs) M.ribbon(ctx, r.x0, r.x1, r.y + line.size * 0.66, rib, out, pal.gust, rtl);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.lead, each: word(t, 0) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.key, each: word(t, nLead) });
    },
  };
}
