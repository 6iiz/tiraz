// A line as the title cartouche of a print: the statement is set in a paper box with a heavy key line and a hairline, and the box opens
// from the reading side like a hanging scroll, a roller running ahead of it, so the words are uncovered in reading order. The key word
// (*…*) is set on a block of the accent wiped lighter at its foot, printed a few pixels off its key line. The optional lead-in, small
// and in a soft ink, is uncovered above the box just before it. The box is rolled up from the far side to leave.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; the roll-up is this style's only exit)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, padX = T.pad.x, padY = T.pad.y;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: full - 2 * padX, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: full, single: true, where: 'the lead-in' }) : null;
  const bw = Math.min(full, Math.max(line.width + 2 * padX, 560)), bh = line.height + 2 * padY;
  const gap = lead ? 30 : 0, block = (lead ? lead.lead + gap : 0) + bh;
  const top = spec.y ?? kit.place(block, 700);
  const bx = (W - bw) / 2, by = top + (lead ? lead.lead + gap : 0), yLead = top + (lead ? lead.lead / 2 : 0);
  const tUn = at + 0.15, out0 = d - T.dur.roll;
  const tOpt = { x0: bx + padX, x1: bx + bw - padX, y: by + padY + line.lead / 2 };
  const runs = M.keyRuns(kit, line, tOpt);                    // one block per key phrase on its row
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d);
      if (lead) M.scroll(ctx, span(t, at, at + T.dur.lead), q, bx, yLead - lead.lead / 2, bw, lead.lead, rtl, P,
        () => kit.drawText(ctx, lead, { x0: bx, x1: bx + bw, y: yLead, align: 'start', color: P.soft }), false);
      const reg = 1 + 2.5 * (1 - M.E(span(t, tUn + 0.3, tUn + T.dur.unroll + 0.2)));      // the colour block settles into register
      M.scroll(ctx, span(t, tUn, tUn + T.dur.unroll), q, bx, by, bw, bh, rtl, P, () => {
        M.cartouche(ctx, bx, by, bw, bh, P);
        runs.forEach((r) => M.keyBlock(ctx, r, line.size, P, T, reg));
        kit.drawText(ctx, line, { ...tOpt, color: P.ink, key: P.on });
      });
    },
  };
}
