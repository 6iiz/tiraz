// A line: the text is built out of small cubes. They are thrown in from the reading-start side in reading order, tumble, drop onto
// their cells and snap; the key words (*…*) are taller cubes in the key colour. The optional lead is set flat above it. While the
// line holds, a slow ripple runs through the cubes; at the end they lift off in reading order and fly away.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; this style always leaves by unbuilding)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 1 });
  const { builder, rec } = await import(look.base + 'cubes.js');
  const { out3 } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 20;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: 800, maxW, minScale: 0.62, lead: 1.5, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: 600, maxW, minScale: 0.92, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, total = (lead ? lead.height + gap : 0) + line.height;
  const top = kit.place(total, spec.y ?? 760);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const set = await W3.voxels(line, { y: yLine, align: 'center' });
  const pool = W3.pool(set.cells.length), out0 = d - T.dur.out;
  const B = builder(W3, set, { pool, t0: at + 0.04, out0, seed: 1 });
  return {
    duration: d,
    draw(ctx, t) {
      const st = B.at(t); pool.commit();
      W3.draw(ctx, t);
      rec(W3, kit, set, st);
      if (lead) {
        const pin = out3(span(t, at, at + 0.3)), pout = span(t, out0, out0 + 0.3);
        if (pout < 1) W3.flat(ctx, lead, { y: yLead, dy: (1 - pin) * 26 - pout * pout * 40, alpha: Math.min(1, pin * 3) * (1 - pout) });
      }
    },
  };
}
