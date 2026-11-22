// A line, set like the headline of a chart: flush to the reading side, the key word (*…*) in the accent with a hairline under it. Under
// the text an axis draws itself with its ticks, and an annotation drops from the key word to its point on the axis, as a note marks
// one value on a chart. The axis carries no numbers: it is a scale for the eye, not data. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const maxW = SAFE.right - SAFE.left;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block + 220, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const yAxis = top + block + 170, hasKey = line.rows.some((r) => r.words.some((w) => w.key));
  // a long line arrives in the same short window as a short one, so an opening hook has landed by the first frame
  const nWords = nLead + line.rows.reduce((s, r) => s + r.words.length, 0), stagger = Math.min(T.dur.stagger, 0.36 / Math.max(1, nWords - 1));
  const words = (t, offset, size) => (w, i, box, c) => {
    const t0 = at + (offset + i) * stagger;
    if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, size, rtl) === false) return false;
    if (M.leave(c, span(t, d - T.dur.out, d), box, size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = 1 - M.D(span(t, d - T.dur.out, d));
      let keyBox = null;
      // the headline marker: a short accent bar on the reading side, above the text
      const pm = M.E(span(t, at, at + 0.3)) * fade;
      if (pm > 0) { ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? SAFE.right - 64 * pm : SAFE.left, top - 34, 64 * pm, 6); }
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'start', color: pal.muted, each: words(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'start', color: pal.text, key: pal.keyText,
        each: (w, i, box, c) => {
          const r = words(t, nLead, line.size)(w, i, box, c); if (r === false) return false;
          if (w.key) { if (!keyBox) keyBox = { ...box }; c.fillRect(box.x, box.y + line.size * 0.62, box.width, 3); }
        } });
      // the axis and its ticks, drawn from the reading side
      const pa = M.D(span(t, at + 0.1, at + 0.1 + T.dur.draw)) * fade;
      if (pa > 0) {
        M.rule(ctx, SAFE.left, SAFE.right, yAxis, pa, pal.axis, 2, rtl);
        M.ticks(ctx, SAFE.left, SAFE.right, yAxis, (SAFE.right - SAFE.left) / 10, pa, pal.axis, rtl, 12);
      }
      if (hasKey && keyBox) {
        const kx = keyBox.x + keyBox.width / 2, rowsBelow = line.rows.length - 1 - keyBox.row;
        const y0 = keyBox.y + line.size * 0.62 + 16 + rowsBelow * line.lead;
        const pl = span(t, at + 0.45, at + 0.75) * fade;
        if (rowsBelow === 0) M.leader(ctx, [kx, y0], [kx, yAxis - 10], pl, pal.accent);
        else M.leader(ctx, [kx, y0 - 8], [kx, yAxis - 10], pl, pal.accent);
        const pd = M.E(span(t, at + 0.7, at + 0.95)) * fade;
        if (pd > 0) { ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(kx, yAxis, 12 * pd, 0, Math.PI * 2); ctx.fill(); }
      }
    },
  };
}
