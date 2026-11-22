// A line on the slate: an optional lead in the dimmer chalk, then the statement in white chalk, centred like a lesson's heading. Each
// word is written in turn at the pace of a hand; the key word (*…*) is written with the accent stick and then underlined with one
// quick wavering stroke. The line stays on the board until the felt wipes it (the joint).
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted and changes nothing: the slate is always wiped)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at: the line is already up when the reel opens, so its entrance is placed far in the past and is whole at frame 0
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 20, x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? 26 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const t0 = at + 0.05, tl = lead ? t0 + T.write.lead + 0.1 : t0, te = tl + T.write.line;
  const sLead = lead ? M.schedule(lead, t0, t0 + T.write.lead, T.write.word) : [], sLine = M.schedule(line, tl, te, T.write.word);
  const strokes = new Map();                       // one underline per key word, made the first time its box is known
  const each = (t, sched, size, keys) => (w, i, box, c) => {
    if (w.key) keys.push({ box, i, size });
    if (M.write(c, span(t, sched[i].s, sched[i].e), box, size, w.arabic) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const white = M.chalk(ctx, P.chalk), dim = M.chalk(ctx, P.dim, 13), acc = M.chalk(ctx, P.accent, 17), keys = [];
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, color: dim, key: acc, each: each(t, sLead, lead.size, []) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, color: white, key: acc, each: each(t, sLine, line.size, keys) });
      keys.forEach(({ box, i, size }, k) => {
        const id = `${i}`; if (!strokes.has(id)) {
          const y = box.y + size * 0.66, a = box.x + box.width + 14, b = box.x - 14;
          strokes.set(id, kit.rtl ? M.stroke(70 + i, a, y, b, y + 4, 5) : M.stroke(70 + i, b, y, a, y + 4, 5));
        }
        const u = te + 0.06 + k * 0.12;
        M.trace(ctx, strokes.get(id), span(t, u, u + 0.28), T.chalk.line, acc);
      });
    },
  };
}
