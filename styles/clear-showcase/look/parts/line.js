// A line in the glass studio: the hero slab floats in the upper part, turning slowly, its comet running round the light guide; the
// lead-in and the statement are centred under it in the light colour, words arriving by a focus pull. The key phrase sits on one frosted
// slab with a lit edge of the accent. spec: { duration, at?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, inner = M.core(P);
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.75 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const block = (lead ? lead.height + 16 : 0) + line.height, top = kit.place(block, 1000);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + 16 : 0) + line.lead / 2;
  const spans = M.keySpans(line, x0, x1, yLine, 'center', rtl);
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, n = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const stg = Math.min(T.dur.stagger, 0.3 / Math.max(1, n - 1)), dur = T.dur.in;
  const word = (t, off, size) => (w, i, box, c) => { const t0 = at + (off + i) * stg; if (M.arrive(c, span(t, t0, t0 + dur), box, size) === false) return false; };
  const keyP = (t) => span(t, at + 0.3, at + 0.75);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, settle = M.IO(span(t, at, at + 1.2));
      M.caustic(ctx, P, W / 2, 730, 400, 0.6 + 0.4 * Math.sin(time * 1.3));
      M.slab(ctx, P, { cx: W / 2, cy: 470 + 30 * (1 - settle), size: 320, yaw: 0.55 + 0.3 * Math.sin(time * 0.22) + 0.25 * (1 - settle), pitch: 0.42, energy: 0.9, phase: time * 2.4, sweep: ground.sweep(t), inner });
      for (const s of spans) M.frost(ctx, P, s, line, keyP(t));
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, color: P.grey, each: word(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, color: P.light, key: P.keyText, each: word(t, nLead, line.size) });
    },
  };
}
