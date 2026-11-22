// A line made of light: the points of each word gather out of the night on spiralling paths, word after word, and the word kindles
// under them. The key phrase (*…*) is in the accent's light and, once it has kindled, one swarm of accent fireflies circles the whole
// phrase. The lead-in is a dimmer light above and may take two rows. At the end the points let go and drift up like embers.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }      cut: the line holds its light until the joint.
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 40, minPx: T.minPx, where: 'the lead-in' }) : null;
  const gap = lead ? 30 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 720);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const LL = lead && M.lightText(kit, lead, { x0: x0 + 20, x1: x1 - 20, y: yLead, color: pal.lead, key: pal.key, gap: T.gap.small, seed: 11 });
  const LN = M.lightText(kit, line, { x0, x1, y: yLine, color: pal.glow, key: pal.key, gap: T.gap.line, seed: 12 });
  const nLead = LL ? LL.boxes.length : 0, n = nLead + LN.boxes.length;
  const budget = at < 0 ? -at - 0.05 : 1.6;
  const G = Math.min(T.dur.gather, budget * 0.5);
  const step = Math.min(T.dur.step, Math.max(0.01, (budget - G - 0.3) / Math.max(1, n - 1)));
  const t1 = spec.cut ? d + 10 : d - T.dur.out - 0.1;
  const whenAt = (k) => ({ t0: at + k * step, g: G, t1, q: T.dur.out });
  const wLead = (i) => whenAt(i), wLine = (i) => whenAt(nLead + i);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (LL) M.drawLight(ctx, LL, t, wLead, { rest: T.tone.dotRest * 0.7 });
      M.drawLight(ctx, LN, t, wLine, { rest: T.tone.dotRest });
      // report where the text is, for the safe-area check (nothing is drawn: the light pictures above are the text)
      if (LL) kit.drawText(ctx, lead, { x0: x0 + 20, x1: x1 - 20, y: yLead, each: () => false });
      kit.drawText(ctx, line, { x0, x1, y: yLine, each: () => false });
    },
  };
}
