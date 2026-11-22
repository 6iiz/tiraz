// A line: the statement plotted word by word on construction baselines that run across the sheet, an optional lead-in above it as a
// small note. The key word (*…*) is the one thing the drawing points at: a box is traced round it in the accent pen and a dimension
// line with extension lines measures it; when it is on the first row a datum balloon hangs off that dimension.
// spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const ink = ground.ink, rtl = kit.rtl, x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const gap = T.space.gap, block = (lead ? lead.height : 0) + gap + line.height;
  const top = spec.y ?? kit.place(block, 620);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height : 0) + gap + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);

  // the key word(s) on the row of the first one, as one box
  const bx = M.boxes(kit, line, { x0, x1, y: yLine, align: 'start' }), keys = bx.filter((b) => b.key);
  const k0 = keys[0], krow = k0 ? keys.filter((b) => b.row === k0.row) : [];
  const key = k0 && { x0: Math.min(...krow.map((b) => b.x)), x1: Math.max(...krow.map((b) => b.x + b.width)), y: k0.y, row: k0.row,
    i: Math.max(...krow.map((b) => b.i)) };
  const kTop = key && key.y - line.size * 0.8, kBot = key && key.y + line.size * 0.68;
  const yDim = key && (key.row === 0 ? yLine - line.lead / 2 - gap * 0.28 : key.y - line.lead / 2);
  const pad = line.size * 0.1;

  const wordAt = (k) => at + k * T.dur.step;
  const keyT = key ? wordAt(nLead + key.i) + T.dur.in : 0;
  const endT = wordAt(nAll - 1) + T.dur.in, out0 = d - T.dur.out;
  const word = (t, offset) => (w, i, box, c) => {
    const k = offset + i;
    if (M.arrive(c, span(t, wordAt(k), wordAt(k) + T.dur.in), box, line.size, rtl, ink.accent) === false) return false;
    if (M.leave(c, span(t, out0 + k * 0.02, d), box, line.size, rtl) === false) return false;
    return w.key ? ink.key : undefined;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const gone = 1 - span(t, out0, d);
      ctx.lineCap = 'butt';
      // construction baselines, one per row, overshooting the margins as a draughtsman's lines do
      ctx.strokeStyle = rgba(ink.light, T.tone.guide); ctx.lineWidth = 1;
      line.rows.forEach((_, r) => {
        const y = yLine + r * line.lead + line.size * 0.42, p = span(t, at - 0.4 + r * 0.1, at + 0.2 + r * 0.1) * gone;
        M.seg(ctx, rtl ? x1 + 24 : x0 - 24, y, rtl ? x0 - 24 : x1 + 24, y, p);
      });
      if (lead) M.seg(ctx, rtl ? x1 + 24 : x0 - 24, yLead + lead.size * 0.5, rtl ? x1 - lead.width - 40 : x0 + lead.width + 40, yLead + lead.size * 0.5, span(t, at - 0.5, at) * gone);
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: ink.dim, each: word(t, 0) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: ink.light, key: ink.key, each: word(t, nLead) });
      if (!key) return;
      // the accent pen marks the key: a traced box, a dimension, a balloon
      ctx.strokeStyle = ink.accent; ctx.lineWidth = 2;
      M.rect(ctx, key.x0 - pad, kTop, key.x1 - key.x0 + 2 * pad, kBot - kTop, span(t, keyT, keyT + T.dur.trace) * gone, rtl);
      ctx.lineWidth = 1.5;
      M.dim(ctx, key.x0 - pad, key.x1 + pad, yDim, span(t, Math.max(keyT, endT) + 0.1, Math.max(keyT, endT) + 0.6) * gone, yDim - kTop);
      if (key.row === 0) {
        const bxc = (key.x0 + key.x1) / 2, r = T.space.balloon, by = yDim - 26 - r, pb = span(t, Math.max(keyT, endT) + 0.5, Math.max(keyT, endT) + 0.9) * gone;
        M.seg(ctx, bxc, yDim, bxc, by + r, pb * 2);
        M.circle(ctx, bxc, by, r, pb * 1.6 - 0.6, rtl);
        if (pb >= 1) { ctx.fillStyle = ink.accent; ctx.beginPath(); ctx.arc(bxc, by, r * 0.32, 0, Math.PI * 2); ctx.fill(); }
      }
    },
  };
}
