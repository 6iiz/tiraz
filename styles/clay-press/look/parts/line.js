// A line: an optional lead-in in thin, soft-coloured clay, then the statement in dark clay, word by word dropped onto the table one
// pose after another. Each word flattens as it lands and wobbles back. The key word (*…*) is a fat piece of the accent clay that
// falls from higher and squashes harder. At the end the words crouch and hop off the top of the frame.
// spec: { duration, at?, y?, cut?: true, says: { text, lead? } }
//   cut: the words stay put to the last frame and the joint carries them away (used for a hook that cuts straight on).
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const world = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { POSE, FALL } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 40, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, where: 'the lead-in' }) : null;
  const gapL = lead ? 30 : 0, block = (lead ? lead.height + gapL : 0) + line.height;
  const top = spec.y ?? kit.place(block, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gapL : 0) + line.lead / 2;
  const L = lead ? await world.text(lead, { x0, x1, y: yLead, color: world.soft }) : { rows: [], pieces: [] };
  const M = await world.text(line, { x0, x1, y: yLine });
  const all = [...L.pieces, ...M.pieces];
  const t0 = (i) => at + i * POSE;
  const out = (i) => (spec.cut ? null : d - 6 * POSE + (i % 3) * POSE * 0.5);
  return {
    duration: d,
    draw(ctx, t) {
      world.frame(ctx, t, (tq, k) => {
        all.forEach((p, i) => world.drop(p, tq, k, t0(i) - (p.key ? POSE : 0), { t1: out(i), amp: p.key ? 1.6 : 1 }));
        return [...L.rows, ...M.rows].map((r) => [r.pieces.map((p) => p.obj), r.text]);
      });
    },
  };
}
