// A line, printed: an optional lead-in in a soft ink tint, then the statement, large and centred like a poster. Under the ink, the
// accent drum lays a ghost of the same words, shifted by this sheet's registration error, so every letter has a thin accent edge.
// The key word (*…*) sits on an accent patch, set in whichever ink reads on it. Above the text, an accent disc and a halftone ink disc
// overlap off the corner of the sheet. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, feed, blob, disc, overprint } = await import(look.base + 'motion.js');
  const P = ground.P, reg = ground.reg, maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the lead-in' }) : null;
  const gap = lead ? 24 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 720);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const rtl = kit.rtl, sx = (x) => (rtl ? x : W - x);         // the shapes sit at the far end of the reading line
  const big = { x: sx(250), y: Math.min(top - 250, 180), r: 220 }, half = { x: sx(430), y: big.y + 90, r: 150 };
  const out0 = d - T.dur.out;
  const word = (t, base, size, ghost) => (w, i, box, c) => {
    const t0 = at + (base + i) * T.dur.step;
    if (arrive(c, span(t, t0, t0 + T.dur.in), box, size) === false) return false;
    if (leave(c, span(t, out0, d), box, size) === false) return false;
    if (ghost) { if (w.key) return false; c.globalCompositeOperation = 'multiply'; return; }
    if (w.key) {
      overprint(c, reg, () => blob(c, box.x - size * 0.16, box.y - size * 0.62, box.width + size * 0.32, size * 1.24, 31 + i, P.accent));
      return P.on;
    }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save();
      if (feed(ctx, span(t, at, at + 0.5), span(t, out0, d), 0, 0, W, Math.max(big.y + big.r, half.y + half.r) + 10) !== false) {
        disc(ctx, half.x, half.y, half.r, ground.screen(ctx, 'ink'));
        overprint(ctx, reg, () => disc(ctx, big.x, big.y, big.r, P.accent));
      }
      ctx.restore();
      ground.wear(ctx);
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, color: P.soft, each: word(t, 0, lead.size, false) });
      kit.drawText(ctx, line, { x0: SAFE.left + reg.x, x1: SAFE.right + reg.x, y: yLine + reg.y, color: P.accent, key: P.accent, decor: true, each: word(t, nLead, line.size, true) });
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, color: P.ink, key: P.on, each: word(t, nLead, line.size, false) });
    },
  };
}
