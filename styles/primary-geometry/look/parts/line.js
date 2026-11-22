// A line: two paper triangles turn a quarter and lock into a plate over the machine; then a small accent square rolls along each row
// and types the words, the grey lead-in first, the statement in ink after it. The key word (*…*, or a run of them) is laid on one
// accent block. The plate leaves by splitting along its seam. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, pad = T.plate.pad;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - pad * 2;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 14 : 0, inner = (lead ? lead.height : 0) + gap + line.height, h = inner + pad * 1.6;
  const top = spec.y ?? kit.place(h, 720);
  const plate = { x: SAFE.left, y: top, w: SAFE.right - SAFE.left, h };
  const yLead = top + pad * 0.8 + (lead ? lead.lead / 2 : 0), yLine = top + pad * 0.8 + (lead ? lead.height + gap : 0) + line.lead / 2;
  const x0 = SAFE.left + pad, x1 = SAFE.right - pad;
  const tText = at + T.dur.stage, tLine = lead ? M.typed(lead, T, tText) - T.dur.row * 0.4 : tText;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.stage(ctx, plate, span(t, at, at + T.dur.stage), span(t, d - T.dur.out, d), P.paper, () => {
        if (lead) M.typeset(ctx, kit, lead, { x0, x1, y: yLead, t, t0: tText, pal: P, T, color: P.grey });
        M.typeset(ctx, kit, line, { x0, x1, y: yLine, t, t0: tLine, pal: P, T });
      });
    },
  };
}
