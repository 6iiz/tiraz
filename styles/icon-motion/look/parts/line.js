// A line: a heavy title flush to the reading side, its rows sliding in sideways out of their own masks one after another, with the
// optional lead in a lighter weight above it (it wraps to a second row rather than shrinking below a readable size). The key phrase
// (*…*, one word or several) rides on one accent capsule, its words in the colour that reads best on the accent. On the stage disc a
// faceless figure raises its arm on every beat. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, S = ground.stage;
  const x0 = SAFE.left, x1 = SAFE.right - 34, maxW = x1 - x0 - M.keyRoom(T.size.line);
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.78 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? Math.min(kit.place(block, 720), T.textBottom - block);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nl = lead ? lead.rows.length : 0, n = nl + line.rows.length;
  const total = (n - 1) * T.dur.stagger + T.dur.row, f = at < 0 ? Math.min(1, (-at - 0.1) / total) : 1;   // an opening line is whole by frame 0
  const inn = (k) => (t) => span(t, at + k * T.dur.stagger * f, at + (k * T.dur.stagger + T.dur.row) * f);
  const o0 = d - T.dur.out - (n - 1) * 0.04, outp = (k) => (t) => span(t, o0 + k * 0.04, o0 + k * 0.04 + T.dur.out);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = ground.time(t), b = Math.floor(time / M.BEAT), ph = (time - b * M.BEAT) / 0.25;
      M.stage(ctx, S.x, S.y, S.r, P);
      M.figure(ctx, S.x, S.y, S.r, P, { wave: b % 2 ? M.snap(ph) : 1 - M.snap(ph), step: 0 });
      if (lead) M.slideText(ctx, kit, lead, { x0, x1, y: yLead, color: P.grey, P, keyed: false, rowIn: (r) => inn(r)(t), rowOut: (r) => outp(r)(t) });
      M.slideText(ctx, kit, line, { x0, x1, y: yLine, color: P.ink, P, rowIn: (r) => inn(nl + r)(t), rowOut: (r) => outp(nl + r)(t) });
    },
  };
}
