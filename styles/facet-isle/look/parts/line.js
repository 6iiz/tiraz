// A line in the sky over the island: the optional lead-in in a quieter tone, then the statement, large, set flush to the reading side.
// Words drop in one after another and land with the bounce. The key phrase (*…*, one or several words) is set in the accent and
// stands on one faceted plinth of the accent that drops in with its first word; a soft hover shadow under the plinth keeps it afloat. Everything lifts off at the end. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 40, x1 = SAFE.right - 40, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 26 : 0, block = (lead ? lead.height : 0) + gap + line.height;
  const top = spec.y ?? kit.place(block, 800);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height : 0) + gap + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const boxes = M.layout(line, x0, x1, yLine, rtl), bars = M.runs(boxes);
  const order = boxes.map((b) => { const r = bars.find((q) => b.i >= q.first && b.i <= q.last); return nLead + (r ? r.first : b.i); });
  const n = nLead + boxes.length, step = Math.min(T.dur.stagger, 0.36 / Math.max(1, n - 1));
  const tIn = (k) => at + k * step;
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), bob = Math.sin((t + clock) * 1.6) * 3;
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'start', color: P.muted,
        each: (w, i, box, c) => { if (M.drop(c, span(t, tIn(i), tIn(i) + T.dur.in), 50) === false) return false; if (M.lift(c, out) === false) return false; } });
      for (const r of bars) {                            // one faceted plinth under the whole key phrase
        const p = span(t, tIn(nLead + r.first), tIn(nLead + r.first) + T.dur.in); if (p <= 0 || out >= 1) continue;
        const pad = line.size * 0.14, y0 = r.y + line.size * 0.64, y1 = y0 + line.size * 0.2;
        ctx.save(); M.hover(ctx, (r.x0 + r.x1) / 2, y1 + 34, r.x1 - r.x0 + pad * 2, Math.min(1, p * 2) * (1 - out));
        if (M.drop(ctx, p, 80) !== false && M.lift(ctx, out) !== false) { ctx.translate(0, bob); M.gemBar(ctx, P, r.x0 - pad, r.x1 + pad, y0, y1, P.accent); }
        ctx.restore();
      }
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.text, key: P.keyText,
        each: (w, i, box, c) => {
          const k = order[i], p = span(t, tIn(k), tIn(k) + T.dur.in);
          if (M.drop(c, p, w.key ? 80 : 60) === false) return false;
          if (M.lift(c, out) === false) return false;
          if (w.key) c.translate(0, bob);
        } });
    },
  };
}
