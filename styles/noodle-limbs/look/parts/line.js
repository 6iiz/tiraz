// A line on a title card. The card pops onto the stage (stretch, squash, settle, on twos), then the bouncing ball drops in and hops from
// word to word in reading order: each word pops up the moment the ball lands on it. The key word (*…*) sits in an accent cartouche, and
// when the line is complete the ball hops back to it and keeps bouncing there on the beat. Under the card the ink-drop fellow dances.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut changes nothing: the projector roll is the only exit)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const cx0 = SAFE.left + 4, cx1 = SAFE.right - 4, x0 = cx0 + 60, x1 = cx1 - 60, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 30, minScale: 0.75, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the lead-in' }) : null;
  const pad = 70, orn = lead ? 56 : 0, inner = (lead ? lead.height : 0) + orn + line.height;
  const top = spec.y ?? kit.place(inner + 2 * pad, 650), bot = top + inner + 2 * pad;
  const yLead = top + pad + (lead ? lead.lead / 2 : 0), yOrn = top + pad + (lead ? lead.height + orn / 2 - 6 : 0), yLine = top + pad + (lead ? lead.height + orn : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, n = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  // the hook is whole by the scene's first frame: when the part starts early, its words come faster
  const step = at < 0 ? Math.min(0.12, (-at - 0.45) / Math.max(1, n)) : Math.min(0.16, 1.1 / Math.max(1, n));
  const tCard = at, tW0 = at + 0.2, landAt = (i) => tW0 + i * step;
  const boxes = [...(lead ? M.layout(lead, { x0, x1, y: yLead }, rtl) : []), ...M.layout(line, { x0, x1, y: yLine }, rtl)];
  const hops = boxes.map((b, i) => ({ x: b.x + b.width / 2, y: b.y - b.size * (b.key ? 0.62 : 0.5), t: landAt(i) }));
  const keyB = boxes.findIndex((b) => b.key);
  if (keyB >= 0) hops.push({ x: hops[keyB].x, y: hops[keyB].y, t: landAt(n - 1) + 0.35 });
  const cy = (top + bot) / 2, S = T.stage;
  const runsLead = lead ? M.keyRuns(lead, { x0, x1, y: yLead }, rtl) : [], runsLine = M.keyRuns(line, { x0, x1, y: yLine }, rtl);
  const word = (t, base, size, runs) => (w, i, box, c) => {
    const p = span(M.twos(t), landAt(base + i), landAt(base + i) + T.pop.word);
    if (M.popAt(c, p, box.x + box.width / 2, box.y + size * 0.5) === false) return false;
    if (w.key) { if (runs[i] !== 'skip') M.cartouche(c, P, runs[i], size); return P.onAccent; }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      M.fellow(ctx, P, W / 2, S.fellowY, S.fellowS, tt + clock, T.beat, tt > landAt(n - 1) && tt < landAt(n - 1) + 1.2 ? 'point' : 'dance');
      const pc = span(tt, tCard, tCard + T.pop.card);
      if (pc <= 0) return;
      ctx.save(); M.popAt(ctx, pc, W / 2, bot);
      M.card(ctx, P, cx0, top, cx1, bot);
      if (lead) { kit.drawText(ctx, lead, { x0, x1, y: yLead, color: P.grey, key: P.grey, each: word(t, 0, lead.size, runsLead) }); M.ornament(ctx, P, W / 2, yOrn, 320); }
      kit.drawText(ctx, line, { x0, x1, y: yLine, color: P.ink, key: P.ink, each: word(t, nLead, line.size, runsLine) });
      ctx.restore();
      M.ball(ctx, P, hops, tt, T.beat);
    },
  };
}
