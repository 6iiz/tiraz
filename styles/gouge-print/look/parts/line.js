// A line, cut in wood. The lead-in is cut straight into the block as letters of light (a hatching that widens until it is solid).
// Then a patch of the block is carved away row by row from the reading side, and the statement is what the gouge left standing:
// black letters of wood on paper. The key word (*…*) gets the print's one colour: a slab of the accent rolled under it after the
// carving. To leave, the block is inked again from the top. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, padX = T.pad.x, padY = T.pad.y;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: full - 2 * padX, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: full, single: true, where: 'the lead-in' }) : null;
  const bw = Math.min(full, line.width + 2 * padX), bh = line.height + 2 * padY;
  const gap = lead ? 34 : 0, block = (lead ? lead.lead + gap : 0) + bh;
  const top = spec.y ?? kit.place(block, 720);
  const bx = rtl ? SAFE.right - bw : SAFE.left, by = top + (lead ? lead.lead + gap : 0), yLead = top + (lead ? lead.lead / 2 : 0);
  const carve = M.patch(bx, by, bw, bh, 11, rtl, T);
  const tCarve = at + 0.2, tCol = tCarve + T.dur.carve, out0 = d - T.dur.ink;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (lead) M.hatch(ctx, span(t, at, at + T.dur.letters), SAFE.left, yLead - lead.size, full, lead.size * 2,
        () => kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'start', color: P.soft }));
      const pc = span(t, tCarve, tCarve + T.dur.carve);
      carve.draw(ctx, pc, P.paper);
      if (pc > 0) {
        const pk = span(t, tCol, tCol + T.dur.colour);
        kit.drawText(ctx, line, { x0: bx + padX, x1: bx + bw - padX, y: by + padY + line.lead / 2, align: 'start', color: P.ink, key: P.ink,
          each: (w, i, box, c) => {
            if (!w.key || pk <= 0) return;
            M.colour(c, pk, box.x - line.size * 0.14, box.y - line.size * 0.76, box.width + line.size * 0.28, line.size * 1.52, P, rtl, 40 + i);
            return pk >= 1 ? P.on : P.ink;
          } });
      }
      M.brayer(ctx, span(t, out0, d), W, H, P);
    },
  };
}
