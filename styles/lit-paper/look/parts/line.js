// A line cut through a card: a dark sheet with cloud-scalloped edges slides up into its groove between the town and the front of the box,
// and the words are cuts in it that light up one after another as the lamp reaches them; the lead-in glows a little dimmer (a thicker
// tissue behind it). A key phrase (*…*) glows through accent tissue and gets one lit slot under it. Lands within 0.68 s of `at`.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   cut: the card stays until the joint takes it.
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = T.textW, x0 = W / 2 - maxW / 2, x1 = W / 2 + maxW / 2;
  const line = M.isolate(kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.85, where: 'the line' }), T.size.line * 0.42, maxW);
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const gap = lead ? 22 : 0, block = (lead ? lead.height : 0) + gap + line.height;
  const top = spec.y ?? kit.place(block + 60, 740) + 30;
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const cw = Math.min(W - 120, Math.max(560, Math.max(line.width, lead ? lead.width : 0) + 150)), ch = block + 100;
  const C = M.card(cw, ch, P, 7), cx0 = W / 2 - cw / 2, cy0 = top - 50;
  const count = (f) => f.rows.reduce((s, r) => s + r.words.filter((w) => !w.ph).length, 0);
  const nLead = lead ? count(lead) : 0, n = nLead + count(line), on = T.dur.light;
  const step = n > 1 ? Math.min(T.dur.step, (0.68 - 0.12 - on) / (n - 1)) : 0, tw = (i) => at + 0.12 + i * step;
  const runs = M.keyRuns(line, x0, x1, yLine, 'center', rtl);
  const softGlow = mix(P.glow, P.card, 0.22);
  const each = (t, base, col) => (w, i, box, c) => {
    if (w.ph) return false;
    const k = base + (w.idx ?? i);
    return M.light(c, span(t, tw(k), tw(k) + on), w.key ? P.key : col, P);
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const g = M.groove(span(t, at, at + 0.42), spec.cut ? 0 : span(t, d - T.dur.out, d));
      if (g) {
        ctx.save(); ctx.translate(ground.drift(t, 0.55), g.dy);
        M.layCard(ctx, C, cx0, cy0, g.lift);
        for (const r of runs) M.slot(ctx, r.x0, r.x1, r.y, line.size, span(t, tw(nLead + r.first), tw(nLead + r.first) + 0.3), P);
        if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'center', color: softGlow, each: each(t, 0, softGlow) });
        kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'center', color: P.glow, key: P.key, each: each(t, nLead, P.glow) });
        ctx.restore();
      }
      ground.drawFront(ctx, t);
    },
  };
}
