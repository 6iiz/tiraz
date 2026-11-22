// A line written into the notebook: an optional lead-in in the soft pencil, then the statement in graphite, each word written in turn
// from the reading side at the pace of a hand. The key word (*…*) is first hatched under in the coloured pencil, then written, then
// underlined twice in graphite. At the end the line is rubbed out in reading order (or, with cut, all at once just before the joint).
// spec: { duration, at?, y?, cut?: true, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 30;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.75, where: 'the lead-in' }) : null;
  const leadH = lead ? lead.height + 20 : 0, block = leadH + line.height;
  const top = spec.y ?? kit.place(block, 620);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + leadH + line.lead / 2;
  // a line that opens the reel (at < 0) is written faster, so that it is whole on the first frame
  const total = (lead ? M.schedule(lead, 0, T.write.lead).end + 0.1 : 0) + M.schedule(line, 0, T.write.line).end, k = at < 0 ? Math.max(1, total / (-at - 0.05)) : 1;
  const sl = lead ? M.schedule(lead, at, T.write.lead * k, 0.07 / k) : null;
  const s = M.schedule(line, sl ? sl.end + 0.1 / k : at, T.write.line * k, 0.07 / k);
  const nLine = line.rows.reduce((n, r) => n + r.words.length, 0), nLead = lead ? lead.rows.reduce((n, r) => n + r.words.length, 0) : 0;
  const hatches = {}, unders = {};
  let i = 0; line.rows.forEach((row) => row.words.forEach((w) => {
    if (w.key) { hatches[i] = M.hatchStrokes(w.width + line.size * 0.5, line.size * 1.0, { angle: rtl ? -0.95 : -2.2, gap: 3.5, len: 30, seed: 40 + i, rtl });
      unders[i] = [M.wobble([0, 0], [1, 0], 300 + i, 0.004), M.wobble([0.04, 0], [0.96, 0], 400 + i, 0.004)]; }
    i++;
  }));
  const rub = spec.cut ? [d - 0.3, d] : [d - T.dur.out, d];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, rub[0], rub[1]);
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'start', color: P.soft,
        each: (w, k, box, c) => M.write(c, t, sl.at(k), box, lead.size, rtl, q, k, nLead + nLine) });
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'start', color: P.graphite, key: P.graphite,
        each: (w, k, box, c) => {
          const [a, b] = s.at(k);
          if (w.key) {                                    // hatch under, before the word is written; underline after
            const ph = span(t, a - 0.35, a), fade = Math.max(0, Math.min(1, q * 1.6 - ((nLead + k) / (nLead + nLine)) * 0.6));
            c.save(); c.globalAlpha = 1 - fade; M.drawHatch(c, hatches[k], box.x - line.size * 0.25, box.y - line.size * 0.42, ph, P.pen);
            const x0 = box.x - 6, x1 = box.x + box.width + 6;
            unders[k].forEach((u, j) => M.pencil(c, u.map(([ux, uy]) => [rtl ? x1 - ux * (x1 - x0) : x0 + ux * (x1 - x0), box.y + line.size * (0.58 + j * 0.13) + uy * 900]),
              span(t, b + 0.05 + j * 0.2, b + 0.3 + j * 0.2), P.graphite, 3 - j));
            c.restore();
          }
          return M.write(c, t, [a, b], box, line.size, rtl, q, nLead + k, nLead + nLine);
        } });
    },
  };
}
