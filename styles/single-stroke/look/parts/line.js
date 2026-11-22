// A line, written by the one line: it comes in at the reading-side edge, runs under the statement (each word is written as the nib
// passes beneath it), swings up and around the key phrase in one loop of the accent, and carries on; then, while the words hold, it
// wanders in a slow cursive garland in the lower margin and leaves at the far edge, where the next scene's line takes over.
// In the opening scene ("at" < 0) the run under the words ends before the first frame. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 22 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block + 80, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const lb = lead ? M.boxes(lead, x0, x1, yLead, 'start', rtl) : [], tb = M.boxes(line, x0, x1, yLine, 'start', rtl);
  const yU = yLine + (line.rows.length - 1) * line.lead + line.size * 1.12;
  const L = M.line(W, T, rtl).route(yU, x0, x1, M.keyGroups(tb), 11).build(T);
  const fast = Math.min(0.6 + L.at.u1 / 4200, at < 0 ? -0.28 - at : 9);
  const keys = [[at, 0], [at + fast, L.at.u1], [Math.max(at + fast + 0.3, d - T.joint), L.total]];
  const when = (b) => M.timeAt(keys, M.crossing(L, b, rtl));
  const lt = lb.map(when), tt = tb.map(when);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.drawLine(ctx, L, M.headAt(keys, t), K);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: K.grey, each: (w, i, b, c) => M.write(c, t, lt[i], b, lead.size, rtl) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: K.ink, key: K.ink, each: (w, i, b, c) => M.write(c, t, tt[i], b, line.size, rtl) });
    },
  };
}
