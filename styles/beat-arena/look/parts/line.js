// A line as a round card on the striped set: the statement in ink on a paper card with a hard ink shadow; the lead-in on a small ink
// banner pinned to the card's top edge. The card pops in, then the words stamp in one by one on half-beats; the key phrase (*…*) is
// stamped as one accent sticker with a burst of speed-lines. While the line holds, the sticker nods on every bar.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; the card leaves the same way)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, set: 'stripes' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const full = SAFE.right - SAFE.left - 14, pad = 56;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: full - pad * 2 - 2 * M.GAP, minScale: 0.7, minPx: 60 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: full - 150, minScale: 0.92, minPx: 44, where: 'the lead-in' }) : null;
  const cw = Math.min(full, Math.max(line.width + pad * 2 + 2 * M.GAP, lead ? lead.width + 64 + 120 : 0, 560)), cx0 = SAFE.left + (full - cw) / 2, cx1 = cx0 + cw;
  const ribH = lead ? lead.height + 18 : 0, ribW = lead ? lead.width + 64 : 0;
  const lift = lead ? 14 : 0, cardH = line.height + 44 + lift, total = (lead ? ribH - 14 : 0) + cardH + T.shadow;
  const top = spec.y ?? kit.place(total, 640);
  const cardY = top + (lead ? ribH - 14 : 0), yLine = cardY + 22 + lift + line.lead / 2;
  const ribX = kit.rtl ? cx1 - 40 - ribW : cx0 + 40, yLead = top + 9 + lead?.lead / 2;
  const n = line.rows.reduce((s, r) => s + r.words.length, 0), step = n > 1 ? Math.min(0.14, T.dur.words / (n - 1)) : 0;
  const wordAt = (i) => at + 0.18 + i * step;
  const runs = M.keyRunsRows(kit, line, { x0: cx0 + pad, x1: cx1 - pad, y: yLine });
  const midY = cardY + cardH / 2, midX = (cx0 + cx1) / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.shrink(span(t, d - T.dur.out, d));
      if (out <= 0) return;
      ctx.save(); M.around(ctx, midX, midY, out);
      const sc = M.pop(span(t, at, at + T.dur.pop));
      if (sc > 0) {
        ctx.save(); M.around(ctx, midX, midY, sc);
        M.card(ctx, cx0, cardY, cw, cardH, pal.paper, pal.ink, T);
        ctx.restore();
        for (const r of runs) {
          const t0 = wordAt(r.first), nod = M.nod(t, t0 + 0.6, T.beat);
          ctx.save(); ctx.translate(M.nudge(runs, r.first, kit.rtl), 0);
          M.sticker(ctx, r, line, pal, T, M.pop(span(t, t0, t0 + T.dur.pop)) * nod);
          M.burst(ctx, (r.x0 + r.x1) / 2, r.y, (r.x1 - r.x0) / 2 + 20, line.size * 0.62, span(t, t0 + 0.06, t0 + 0.42), pal.ink);
          ctx.restore();
        }
        kit.drawText(ctx, line, { x0: cx0 + pad, x1: cx1 - pad, y: yLine, align: 'start', color: pal.ink, key: pal.onAccent,
          each: (w, i, box, c) => { const s = M.pop(span(t, wordAt(i), wordAt(i) + T.dur.pop)); if (s <= 0) return false; c.translate(M.nudge(runs, i, kit.rtl), 0); M.around(c, box.x + box.width / 2, box.y, s); } });
      }
      if (lead) {
        const s = M.pop(span(t, at + 0.08, at + 0.08 + T.dur.pop));
        if (s > 0) {
          ctx.save(); M.around(ctx, ribX + ribW / 2, top + ribH / 2, s);
          M.ribbon(ctx, ribX, top, ribW, ribH, pal);
          ctx.fillStyle = pal.accent; ctx.fillRect(ribX + 18, top + ribH - 6, ribW - 36, 6);
          kit.drawText(ctx, lead, { x0: ribX + 32, x1: ribX + ribW - 32, y: yLead, align: 'start', color: pal.paper });
          ctx.restore();
        }
      }
      ctx.restore();
    },
  };
}
