// A line in the notes: the lead (when there is one) sits on a ribbon banner: the fineliner draws the band, the folded tails are shaded
// in grey marker, and the lead is written on it. Then the statement is written large under it, word by word from the reading side, and
// the key word (*…*) gets one swipe of highlighter behind it. spec: { duration, at?, y?, cut?, says: { text, lead? } }  (cut changes nothing)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  // a negative at means the line is already up when the reel opens: its entrance is done before frame 0, so the hook is whole
  const T = look.tokens, at = (spec.at ?? 0) < 0 ? -60 : (spec.at ?? 0), d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, where: 'the line' });
  // a long lead wraps onto a second row of a taller ribbon instead of shrinking below a readable size
  const leadOpt = { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 190, minScale: 0.95, where: 'the lead-in' };
  let lead = spec.says.lead ? kit.fit(spec.says.lead, leadOpt) : null;
  if (lead && lead.rows.length === 2) {                         // even the two rows out, so the second is not one lonely word
    const even = kit.fit(spec.says.lead, { ...leadOpt, maxW: (lead.rows[0].width + lead.rows[1].width + lead.space) / 2 * 1.1 });
    if (even.rows.length === 2 && even.size === lead.size) lead = even;
  }
  const bh = !lead ? 0 : lead.rows.length === 1 ? lead.size * 1.75 : lead.height + lead.size * 0.85;
  const gap = lead ? 60 : 0, block = bh + gap + line.height, top = spec.y ?? kit.place(block, 640);
  const yLead = top + bh / 2, yLeadText = lead ? yLead - (lead.rows.length - 1) * lead.lead / 2 : 0, yLine = top + bh + gap + line.lead / 2;
  const B = lead ? M.banner(41, W / 2, yLead, lead.width + 90, bh, lead.size * 1.75) : null;
  const t0 = at + 0.05, tw = lead ? t0 + 0.55 : t0, tl = lead ? tw + T.write.lead + 0.08 : t0, te = tl + T.write.line;
  const sLead = lead ? M.schedule(lead, tw, tw + T.write.lead, T.write.word) : [], sLine = M.schedule(line, tl, te, T.write.word);
  const keys = M.layout(line, { x0, x1, y: yLine }, rtl).filter((b) => b.key);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); ctx.translate(0, ground.drift(t));
      if (B) {
        const pt = span(t, t0, t0 + 0.32);
        if (pt > 0) for (const tail of B.tails) { M.shade(ctx, span(t, t0 + 0.25, t0 + 0.45), tail, [Math.min(...tail.map((p) => p[0])), Math.min(...tail.map((p) => p[1])), Math.max(...tail.map((p) => p[0])), Math.max(...tail.map((p) => p[1]))], P.greyDeep, rtl, 3); M.trace(ctx, [...tail, tail[0]], pt, T.pen.fine, P.ink); }
        const [bx0, by0, bx1, by1] = B.band;
        if (pt > 0) { ctx.fillStyle = P.paper; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0); }
        M.shade(ctx, span(t, t0 + 0.3, t0 + 0.5), (c) => { c.beginPath(); c.rect(bx0, by0, bx1 - bx0, by1 - by0); }, B.band, P.grey, rtl, 4);
        M.trace(ctx, B.outline, pt, T.pen.fine, P.ink);
        kit.drawText(ctx, lead, { x0, x1, y: yLeadText, color: P.ink, key: P.ink, each: M.writer(t, sLead, lead.size) });
      }
      keys.forEach((b, k) => M.highlight(ctx, span(t, te + 0.05 + k * 0.15, te + 0.3 + k * 0.15), b, line.size, P.hl, rtl));
      kit.drawText(ctx, line, { x0, x1, y: yLine, color: P.ink, key: P.ink, each: M.writer(t, sLine, line.size) });
      ctx.restore();
    },
  };
}
