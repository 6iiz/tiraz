// A line as the lettering of an engraved plate: the lead-in small and in a soft ink, a rule with a lozenge cut from its middle outward,
// then the statement, centred, each word engraved in three passes (a first family of lines cut across it from the reading side, a
// crossing family, then solid ink). When the key word (*…*) is solid, a wash of the accent is laid over it by hand. A short double rule
// closes the block. To leave, the plate is wiped from the far side. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at means the line is already up when the reel opens: its entrance is done before frame 0, so the hook is whole
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: full - 20, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: full, single: true, where: 'the lead-in' }) : null;
  const leadH = lead ? lead.lead + 46 : 0, block = leadH + line.height + 50;
  const top = spec.y ?? kit.place(block, 720), cx = W / 2;
  const yLead = top + (lead ? lead.lead / 2 : 0), yRule = top + (lead ? lead.lead + 20 : 0), yLine = top + leadH + line.lead / 2, yEnd = top + leadH + line.height + 24;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const keys = []; let wi = 0;                                   // where the key words are, for the wash
  line.rows.forEach((r) => r.words.forEach((w) => { if (w.key) keys.push(wi); wi++; }));
  const word = (t, base) => (w, i, box, c) => {
    const t0 = at + (base + i) * T.dur.step;
    return M.engrave(c, span(t, t0, t0 + T.dur.word), box, T.size.line, w.key ? P.ink : c.fillStyle, rtl);
  };
  const boxes = {};
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.wiped(ctx, span(t, d - T.dur.out, d), W, H, rtl, () => {
        if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, color: P.soft, each: word(t, 0) });
        if (lead) M.ornament(ctx, cx, yRule, Math.min(full, Math.max(lead.width, 300) + 120), span(t, at + 0.1, at + 0.6), P);
        kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, color: P.ink, key: P.ink,
          each: (w, i, box, c) => { boxes[i] = box; return word(t, nLead)(w, i, box, c); } });
        keys.forEach((k) => {
          const b = boxes[k]; if (!b) return;
          const t0 = at + (nLead + k) * T.dur.step + T.dur.word + 0.05;
          M.wash(ctx, b.x + b.width / 2, b.y + 4, b.width / 2 + 34, line.size * 0.66, span(t, t0, t0 + T.dur.wash), P, 13 + k);
        });
        const pe = M.E(span(t, at + 0.5, at + 1.0)) * 90;
        if (pe > 0) { ctx.fillStyle = P.ink; M.swell(ctx, cx - pe, yEnd, cx + pe, yEnd, 3); M.swell(ctx, cx - pe * 0.6, yEnd + 9, cx + pe * 0.6, yEnd + 9, 1.6); }
      });
    },
  };
}
