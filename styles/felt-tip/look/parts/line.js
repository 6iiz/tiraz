// A line lettered with the marker on a fresh sheet: an optional lead-in in the grey marker, then the statement in black, each word
// outlined and then coloured in, from the reading side. Before the key word (*…*) is lettered, the coloured marker colours in a block
// behind it with its broad side, so the black ink lands darker where it crosses the colour. The line stays: the sheet is peeled away.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted and changes nothing: the sheet always leaves by the peel)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 30;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.75, where: 'the lead-in' }) : null;
  const leadH = lead ? lead.height + 26 : 0, block = leadH + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + leadH + line.lead / 2;
  const total = (lead ? M.schedule(lead, 0, T.write.lead).end + 0.1 : 0) + M.schedule(line, 0, T.write.line).end, k = M.hurry(at, total);
  const sl = lead ? M.schedule(lead, at, T.write.lead * k, 0.06 / k, 0.14 / k) : null;
  const s = M.schedule(line, sl ? sl.end + 0.1 / k : at, T.write.line * k, 0.06 / k, 0.14 / k);
  const fills = {}; let i = 0;
  line.rows.forEach((row) => row.words.forEach((w) => { if (w.key) fills[i] = M.fillIn(0, 0, w.width + line.size * 0.3, line.size * 0.9, T.pen.fill, rtl, 30 + i); i++; }));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'start', color: P.grey,
        each: (w, j, b, c) => M.letter(c, t, sl.at(j), w, b, lead, P.grey, rtl) });
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'start', color: P.ink, key: P.ink,
        each: (w, j, b, c) => {
          const sp = s.at(j);
          if (fills[j]) {
            const ox = b.x - line.size * 0.15, oy = b.y - line.size * 0.45;
            M.marker(c, fills[j].map(([x, y]) => [x + ox, y + oy]), span(t, sp[0] - 0.3 / k, sp[0]), P.pen, T.pen.fill, T.pen.tint);
          }
          return M.letter(c, t, sp, w, b, line, P.ink, rtl);
        } });
    },
  };
}
