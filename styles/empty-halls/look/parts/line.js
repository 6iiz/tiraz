// A line: the words come into focus over the dark far end of the hall, row by row, the way a home camera hunts (soft, sharp, a little
// soft, sharp). The lead sits above in a dimmer light (it wraps rather than shrinks). The key phrase (*…*, one word or several) is held by
// one set of focus brackets in the accent and set in full light while the rest is a shade dimmer. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0 - M.keyRoom(T.size.line);
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, minScale: 0.92, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, T.vy - 20);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nl = lead ? lead.rows.length : 0, n = nl + line.rows.length;
  const total = (n - 1) * T.dur.row + T.dur.focus, f = at < 0 ? Math.min(1, (-at - 0.08) / total) : 1;   // an opening line is sharp by frame 0
  const when = (r) => at + r * T.dur.row * f, out0 = d - T.dur.out;
  const keyed = /\*/.test(spec.says.text);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = ground.time(t), out = span(t, out0, d);
      M.shade(ctx, P, x0, x1, top, top + block);
      if (lead) M.focusText(ctx, kit, lead, { x0, x1, y: yLead, color: P.grey, P, keyed: false, when, out, t, time, dur: T.dur.focus * f });
      M.focusText(ctx, kit, line, { x0, x1, y: yLine, color: keyed ? P.dim : P.text, keyColor: P.text, P, when: (r) => when(nl + r), out, t, time, dur: T.dur.focus * f });
      ground.over(ctx, t);
    },
  };
}
