// A line under the model town: the three Memphis marks pop in over the text zone, then the lead-in in a softer ink and the statement
// in ink, set flush to the reading side. Words pop in one by one (a small spring and a tilt that settles). The key phrase (*…*, one
// word or several) sits on one sticker: an accent pill with an ink outline and a hard dotted shadow. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, Z = T.zone, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = M.widen(M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - T.size.line * 0.7, minScale: 0.6 }), T.size.line * 0.35, maxW);
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 22 : 0, block = (lead ? lead.height : 0) + gap + line.height;
  const top = spec.y ?? Z.top + Math.max(0, (Z.bottom - Z.top - block) * 0.3);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height : 0) + gap + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const boxes = M.layout(line, x0, x1, yLine, rtl), stickers = M.runs(boxes);
  const order = boxes.map((b) => { const r = stickers.find((q) => b.i >= q.first && b.i <= q.last); return nLead + (r ? r.first : b.i); });
  const n = nLead + boxes.length, step = Math.min(T.dur.stagger, 0.36 / Math.max(1, n - 1)), tIn = (k) => at + 0.05 + k * step;
  const soft = mix(P.ink, P.paper, 0.3);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      M.marksRow(ctx, P, t, at, rtl ? SAFE.right : SAFE.left, Z.marks, rtl, out);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: soft,
        each: (w, i, box, c) => { if (M.pop(c, span(t, tIn(i), tIn(i) + T.dur.in), box.x + box.width / 2, box.y) === false) return false; if (M.leave(c, out, box.x + box.width / 2, box.y) === false) return false; } });
      for (const r of stickers) {
        const p = span(t, tIn(nLead + r.first), tIn(nLead + r.first) + T.dur.in); if (p <= 0 || out >= 1) continue;
        const px = line.size * 0.26, cx = (r.x0 + r.x1) / 2;
        ctx.save(); M.pop(ctx, p, cx, r.y, -8); M.leave(ctx, out, cx, r.y);
        M.sticker(ctx, P, r.x0 - px, r.x1 + px, r.y - line.size * 0.6, r.y + line.size * 0.62, P.accent);
        ctx.restore();
      }
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.ink, key: P.onAccent,
        each: (w, i, box, c) => {
          const k = order[i], st = stickers.find((q) => i >= q.first && i <= q.last), cx = st ? (st.x0 + st.x1) / 2 : box.x + box.width / 2;
          if (M.pop(c, span(t, tIn(k), tIn(k) + T.dur.in), cx, box.y, st ? -8 : -6) === false) return false;
          if (M.leave(c, out, cx, box.y) === false) return false;
        } });
    },
  };
}
