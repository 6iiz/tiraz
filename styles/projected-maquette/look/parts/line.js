// A line as a projected readout above the model: a small legend chip in the layer colour, the lead-in in grey, the statement in the
// model's white, each word switched on like a slide (strike, flicker, focus). The layer is a wash: an edge of accent light crosses the
// table from the reading side; then the key phrase comes up in the accent with a projected glow and one hairline pin runs from it down
// to the building it is about, which takes the full light. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.7 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 1, where: 'the lead-in' }) : null;
  const chip = 46, gap = lead ? 14 : 0, block = chip + (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 600);
  const yChip = top + 12, yLead = top + chip + (lead ? lead.lead / 2 : 0), yLine = top + chip + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const words = M.layout(kit, line, { x0, x1, y: yLine }), R = M.runs(words);
  const firstKey = words.find((w) => w.key)?.index;
  const t0 = (k) => at + 0.1 + k * T.dur.step;
  const keyOn = firstKey === undefined ? null : t0(nLead + firstKey) + T.dur.strike - 0.1;
  const target = ground.pick(0), MW = T.model.cols * T.model.cell;
  const glowK = rgba(pal.accent, 0.6);
  const each = (t, base, size, col) => (w, i, box, c) => M.strike(c, span(t, t0(base + i), t0(base + i) + T.dur.strike), 0, w.key ? pal.key : col, pal.dark, size, w.key ? glowK : null);
  return {
    duration: d,
    draw(ctx, t) {
      const front = M.E(span(t, at, at + 0.8)) * (MW + 2) - 1, tk = keyOn === null ? 0 : M.E(span(t, keyOn, keyOn + 0.3));
      ground.draw(ctx, t, { lit: (b) => {
        const reached = rtl ? b.cx > MW - front : b.cx < front;
        if (b === target && tk > 0) return [pal.accent, 0.35 + 0.65 * tk];
        return reached ? [pal.accent, 0.15] : null;
      } });
      // the legend chip: a square in the layer colour and a hairline
      const cp = M.E(span(t, at, at + 0.3));
      if (cp > 0) {
        ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? x1 - 16 : x0, yChip - 8, 16, 16);
        ctx.fillStyle = rgba(pal.light, 0.35); const rw = 220 * cp; ctx.fillRect(rtl ? x1 - 28 - rw : x0 + 28, yChip - 0.5, rw, 1.5);
      }
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.grey, key: pal.key, each: each(t, 0, lead.size, pal.grey) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.light, key: pal.key, each: each(t, nLead, line.size, pal.light) });
      // one pin, from the key phrase down to its building
      if (R.length && tk > 0) {
        const r = R[0], ax = (r.x0 + r.x1) / 2, ay = r.y + line.size * 0.62, roof = ground.roof(target, t);
        const by = ay + (roof.y - ay) * tk, bx = ax + (roof.x - ax) * tk;
        ctx.save(); ctx.strokeStyle = rgba(pal.light, 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = pal.light; ctx.beginPath(); ctx.arc(ax, ay, 3.5, 0, Math.PI * 2); ctx.fill();
        if (tk > 0.95) { ctx.strokeStyle = pal.key; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(roof.x, roof.y, 9 + 3 * Math.sin((t + clock) * 3), 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
      }
    },
  };
}
