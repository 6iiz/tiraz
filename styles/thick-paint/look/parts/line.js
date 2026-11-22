// A line laid with the knife: an optional lead-in in the muted paint, then the statement row by row, each row laid by its own pass
// of the blade with a lip of fresh paint on the edge. The key word (*…*) sits on a slab of the accent that the same pass lays under it,
// in the colour that reads on the accent. Every letter has body (a lit and a dark edge). The line leaves scraped off by a last pass.
// spec: { duration, at?, y?, cut?: true, says: { text, lead? } }   (cut: the scrape is faster and starts later, a hard take-off)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 40;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.75, where: 'the lead-in' }) : null;
  const leadH = lead ? lead.height + 24 : 0, block = leadH + line.height;
  const top = spec.y ?? kit.place(block, 600);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + leadH + line.lead / 2;
  // a slab of the accent under each key word, built once
  const slabs = []; let n = 0;
  line.rows.forEach((row) => row.words.forEach((w) => {
    if (w.key) slabs[n] = M.plane(w.width + line.size * 0.4, line.size * 1.22, P.accent, [P.paint, P.ground], 300 + n * 17, { row: line.size * 0.42, pad: 14 });
    n++;
  }));
  const rowT = (r) => at + T.dur.lead * (lead ? 1 : 0) + r * T.dur.row;
  const outT = spec.cut ? [d - 0.32, d] : [d - T.dur.out, d];
  const box = (yc, h) => ({ x: SAFE.left - 20, y: yc - h / 2, w: SAFE.right - SAFE.left + 40, h });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, outT[0], outT[1]);
      if (lead) lead.rows.forEach((_, r) => {
        const yy = yLead + r * lead.lead;
        M.knife(ctx, box(yy, lead.lead), span(t, at + r * 0.12, at + r * 0.12 + T.dur.pass * 0.8), q, rtl, () =>
          M.relief(kit, ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, color: P.muted, surface: P.ground,
            each: (w, i, b) => b.row === r }), null);
      });
      line.rows.forEach((_, r) => {
        const yy = yLine + r * line.lead, t0 = rowT(r);
        M.knife(ctx, box(yy, line.lead), span(t, t0, t0 + T.dur.pass), q, rtl, () =>
          M.relief(kit, ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, color: P.paint, key: P.onAccent, surface: P.ground, keySurface: P.accent,
            each: (w, i, b) => b.row === r,
            under: (w, i, b, c) => { if (slabs[i]) M.drawPlane(c, slabs[i], b.x - line.size * 0.2, b.y - line.size * 0.61); } }), P.plane2);
      });
    },
  };
}
