// A line as a game message: the window opens in four hard steps, then the words come in whole, one per game tick, like a message
// being typed out (Arabic is never cut into letters). The lead-in sits on the first row in the lighter tone; the key word (*…*) is set
// on a notched block of the brand's accent. When the message is complete a small arrow blinks in the corner; then the text clears and
// the window folds shut in steps. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, u = M.PX;
  const wx = 72, ww = 936, pad = 9 * u, inner = ww - 2 * pad;
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: inner, minPx: 44, where: 'the lead-in' }) : null;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: inner, minScale: 0.6 });
  const gap = lead ? 2 * u : 0, h = M.snap(pad + (lead ? lead.height + gap : 0) + line.height + pad + 2 * u);
  const top = M.snap(spec.y ?? kit.place(h, 700));
  const yLead = top + pad + (lead ? lead.lead / 2 : 0), yLine = top + pad + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nLine = line.rows.reduce((s, r) => s + r.words.length, 0);
  const tick = Math.min(T.dur.tick, 0.42 / (nLead + nLine)), tw = at + 0.3, tDone = tw + (nLead + nLine) * tick;
  const tClear = d - 0.3, x0 = wx + pad, x1 = wx + ww - pad;
  const word = (t, k0, f) => (w, i, box, c) => {
    if (t < tw + (k0 + i) * tick || t >= tClear) return false;
    if (w.key) { M.block(c, box.x - f.space * 0.55, box.y - f.size * 0.62, box.x + box.width + f.space * 0.55, box.y + f.size * 0.62, P.a); return P.onA; }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const open = M.stepped(span(t, at, at + 0.24)) * (1 - M.stepped(span(t, d - 0.26, d - 0.04), 3));
      if (!M.win(ctx, wx, top, ww, h, P, open) || open < 1) return;
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.lead, key: P.lead, each: word(t, 0, lead) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.l, key: P.l, each: word(t, nLead, line) });
      if (t >= tDone && t < tClear && Math.floor((t - tDone) * 2.5) % 2 === 0) {       // the "more" arrow blinks at the end of the reading
        const ax = kit.rtl ? wx + 4 * u : wx + ww - 11 * u;
        M.sprite(ctx, M.ARROW_DOWN, ax, top + h - 8 * u + (Math.floor((t - tDone) * 5) % 2) * u, { o: P.l }, u);
      }
    },
  };
}
