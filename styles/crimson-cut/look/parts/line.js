// A line under a window flower: a folded wedge of red paper is pasted above the text and snaps open (a quarter, a half, the whole
// rosette); the lead-in is pasted on a deep red banner with swallow-tail ends; then the statement's words are pasted one by one, on two
// drawings each. The key word (*…*) is pasted on its own card of red paper. They leave by dropping off the sheet, a step at a time.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: 860, minScale: 0.8 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 160, single: true, where: 'the lead-in' }) : null;
  const bh = lead ? lead.size * 1.9 : 0, bw = lead ? lead.width + 150 : 0, leadH = lead ? bh + 34 : 0;
  const block = leadH + line.height, top = spec.y ?? kit.place(block, 840);
  const R = 150, cy = Math.max(SAFE.top - 60, top - 30 - R), rose = M.rosette(R, P.red, 0, 5);
  const ban = lead ? M.banner(bw, bh, P.deep, 22) : null, yLead = top + bh / 2, yLine = top + leadH + line.lead / 2;
  const cards = new Map(), nLead = lead ? lead.rows[0].words.length : 0;
  const t0 = (i) => at + 0.3 + i * T.dur.step;
  const gone = (i) => d - T.dur.out + i * 0.03;
  const each = (base) => (w, i, box, c) => {
    const k = M.paste(t, t0(base + i)); if (k <= 0) return false;
    const dr = span(t, gone(base + i), gone(base + i) + 0.12); if (!spec.cut && dr >= 1) return false;
    const cx = box.x + box.width / 2;
    c.translate(cx, box.y + (spec.cut ? 0 : M.steps12(dr) * 90)); c.scale(k, k); c.translate(-cx, -box.y);
    if (w.key) {
      const key = Math.round(box.width) + '_' + box.row;
      if (!cards.has(key)) cards.set(key, M.card(box.width + line.space * 0.7, line.size * 1.3, P.red, 40 + cards.size));
      M.lay(c, cards.get(key), cx, box.y);
      return P.onRed;
    }
  };
  let t = 0;
  return {
    duration: d,
    draw(ctx, tt) {
      t = tt; ground.draw(ctx, t);
      const out = spec.cut ? 0 : span(t, d - T.dur.out, d);
      if (out < 1) { ctx.save(); ctx.translate(0, M.steps12(out) * 120); M.unfold(ctx, rose, W / 2, cy, t - at, { gap: T.unfold.gap, dur: T.unfold.swing, turn: t * 0.04 }); ctx.restore(); }
      if (lead) {
        const k = M.paste(t, at + 0.2); if (k > 0 && out < 1) {
          ctx.save(); ctx.translate(0, M.steps12(out) * 90);
          M.lay(ctx, ban, W / 2, yLead, k);
          ctx.translate(W / 2, yLead); ctx.scale(k, k); ctx.translate(-W / 2, -yLead);
          kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'center', color: P.onDeep });
          ctx.restore();
        }
      }
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'center', color: P.txt, key: P.onRed, each: each(nLead) });
    },
  };
}
