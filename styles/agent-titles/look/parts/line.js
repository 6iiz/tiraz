// A line as a credit in its set: on a paper-ink location, the lead-in sits on a snipped ink strip; the statement's words slide in along
// their row from the reading side, stop dead and slap down on twos; the key word (*…*) is cut on a card of the hot ink with a paper
// shadow. Under it all, the agent walks along a ledge in the reading direction, on twos. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, which: 'paper', seed: 3 });
  const M = await import(look.base + 'motion.js'), I = ground.I, G = ground.color, txt = ground.ink;
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 40, minScale: 0.7 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 120, single: true, where: 'the lead-in' }) : null;
  const leadH = lead ? lead.size * 1.7 + 40 : 0, block = leadH + line.height;
  const top = spec.y ?? kit.place(block, 600);
  const yLead = top + (lead ? lead.size * 0.85 : 0), yLine = top + leadH + line.lead / 2;
  const nLead = lead ? lead.rows[0].words.length : 0;
  const keyFill = G === I.hot ? I.ink : I.hot, keyInk = I.on(keyFill);
  const sw = lead ? lead.width + 70 : 0, sh = lead ? lead.size * 1.7 : 0;
  const leadStrip = lead ? M.cut(M.strip(0, -sh / 2, sw, sh, 18), 11) : null;
  const ledge = M.cut(M.rect(-40, 0, W + 80, 22), 12, 1.4), cards = new Map();
  const card = (w, box, c) => {
    const k = Math.round(box.width) + '_' + box.row;
    if (!cards.has(k)) { const p = line.space * 0.3; cards.set(k, M.cut(M.rect(-p, -line.size * 0.66, box.width + p * 2, line.size * 1.32), 20 + cards.size)); }
    c.save(); c.translate(box.x, box.y); M.piece(c, cards.get(k), keyFill, G); c.restore();
    return keyInk;
  };
  const t0 = (i) => at + 0.05 + i * T.dur.stagger + (i >= nLead ? 0.08 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = spec.cut ? 0 : span(t, d - T.dur.out, d), dirIn = rtl ? 1 : -1;
      // the ledge and the agent on it
      ctx.save(); ctx.translate(0, T.ledge); M.piece(ctx, ledge, I.ink, G); ctx.restore();
      const x = M.walkX(t, at, rtl ? W + 80 : -80, rtl ? -1 : 1);
      M.agent(ctx, x, T.ledge + 2, T.agent, rtl ? -1 : 1, t, { fill: I.ink, scarf: I.hot, gap: G });
      if (lead) {
        const p = span(t, at, at + T.dur.slide), dx = (1 - M.O(p)) * dirIn * 900 - dirIn * M.I(out) * 1300;
        if (p > 0) {
          const x0 = rtl ? SAFE.right - sw : SAFE.left;
          ctx.save(); ctx.translate(x0 + dx, yLead); M.piece(ctx, leadStrip, I.ink, G); ctx.restore();
          kit.drawText(ctx, lead, { x0: x0 + 35 + dx, x1: x0 + sw - 35 + dx, y: yLead, align: 'center', color: I.on(I.ink) });
        }
      }
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'start', color: txt, key: keyInk,
        each: M.credit(t, (i) => t0(nLead + i), T.dur.slide, out, rtl, card) });
    },
  };
}
