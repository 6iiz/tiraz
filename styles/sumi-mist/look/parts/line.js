// A line as ink on paper: an optional quiet lead-in in a middle tone, then the statement in the darkest ink, set flush to the reading
// side with the rest of the paper left empty. Each word blooms out of its own soft bleed and sharpens. Under the key word (*…*) a loaded
// brush lays one pale swash along the reading direction, running dry at its tail, and the red seal is pressed at the tail.
// Everything leaves by dissolving into mist. spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; ink only dissolves)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at: the line is already up when the reel opens, so its entrance is placed far in the past and is whole at frame 0
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left - 20, x0 = SAFE.left, x1 = SAFE.right - 20;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? 34 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 600);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const bx = M.boxes(line, { x0, x1, y: yLine, rtl });
  // when each word of the line starts to bloom: a breath before the key word
  const starts = []; let tt = at + nLead * T.dur.step;
  bx.forEach((b) => { if (b.key && (b.i === 0 || !bx[b.i - 1].key)) tt += 0.14; starts.push(tt); tt += T.dur.step; });
  const spans = M.keySpans(bx).map((s, k) => ({ ...s, t0: starts[s.first] - 0.3, S: M.swash(s.x0, s.x1, s.y, line.size, rtl, 40 + k) }));
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d);
      for (const s of spans) {
        const fade = 1 - M.I(out);
        M.paint(ctx, s.S, M.B(span(t, s.t0, s.t0 + T.dur.stroke)), pal.tone(T.tone.wash), fade);
        const tail = s.S.P[Math.floor(0.86 * (s.S.P.length - 1))];
        const sz = T.size.seal;
        ctx.save(); ctx.globalAlpha = fade;
        M.seal(ctx, rtl ? s.x1 - sz * 0.2 : s.x0 + sz * 0.2, s.y + line.size * 0.56, sz, pal, span(t, s.t0 + T.dur.stroke + 0.25, s.t0 + T.dur.stroke + 0.45));
        ctx.restore();
      }
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.grey,
        each: (w, i, box, c) => M.bloom(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.in), out, pal.ink, lead.size) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.quiet(0.66), key: pal.ink,
        each: (w, i, box, c) => M.bloom(c, span(t, starts[i], starts[i] + T.dur.in), span(t, out0 + i * 0.02, d), pal.ink, line.size) });
    },
  };
}
