// A line: an optional small grey lead-in, then the statement, large and set flush to the reading side. Words rise one by one on
// sixteenth notes; the key word (*…*) is set in ink on a block of the brand's accent (overprint), never as accent-coloured text.
// spec: { duration, at?, y?, cut?: true, says: { text, lead? } }
//   cut: the line leaves by the knife instead of rising out.
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, knife } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const block = (lead ? lead.height : 0) + line.height;
  const top = spec.y ?? kit.place(block, 560);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const greyC = mix(ground.paper, ground.ink, T.tone.grey);
  const out0 = d - T.dur.out, cutAt = d - 0.375;
  const word = (t, i, size) => (w, _, box, c) => {
    const k = i(_);
    if (arrive(c, span(t, at + k * T.dur.step, at + k * T.dur.step + T.dur.in), box, size) === false) return false;
    if (!spec.cut && leave(c, span(t, out0, d), box, size) === false) return false;
    if (w.key) { c.fillStyle = brand.colors.accent; c.fillRect(box.x - size * 0.12, box.y - size * 0.62, box.width + size * 0.24, size * 1.2); return ground.ink; }
  };
  const x0 = SAFE.left, x1 = SAFE.right;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const body = () => {
        if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: greyC, each: word(t, (i) => i, lead.size) });
        kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: ground.ink, key: ground.ink, each: word(t, (i) => nLead + i, line.size) });
      };
      if (spec.cut) knife(ctx, span(t, cutAt, d), x0, x1, top + block / 2, ground.ink, kit.rtl, body); else body();
    },
  };
}
