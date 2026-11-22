// A line as a caption over footage: the lead-in is a label chip, then the statement is slammed on in chunks of one or two words, huge,
// with the key word (*…*) on a block of the accent. The footage drifts under a scrim; the scene ends on a hard cut.
// spec: { duration, at?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, C = T.caption;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: C.size, weight: C.weight, maxW, minScale: 0.72 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.chip, weight: 700, maxW: maxW - 60, single: true, where: 'the lead-in' }) : null;
  const ch = M.chunks(line, C.chunk), chipH = lead ? lead.size * 1.5 + 34 : 0;
  const top = kit.place(chipH + line.height, C.y), yChip = top + (lead ? lead.size * 0.75 : 0), yLine = top + chipH + line.lead / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, top);
      M.chip(kit, ctx, lead, { y: yChip, p: span(t, at, at + T.dur.chip), P, rtl: kit.rtl });
      M.caption(kit, ctx, line, { y: yLine, t, t0: at + 0.15, gap: C.gap, P, T, ch });
    },
  };
}
