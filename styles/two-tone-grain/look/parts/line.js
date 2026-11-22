// A line in a 1-bit window. The plate (ink body, one-dot paper frame, striped title bar, dotted shadow) comes up through the
// ordered dither; the lead-in, when there is one, is its title, set in the gap of the stripes. Then the words are set one at a time
// behind a block cursor. The key word (*…*) sits on a block of the brand's accent. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x = SAFE.left, w = SAFE.right - SAFE.left, pad = 44;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: w - pad * 2, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: w - 200, single: true, where: 'the lead-in' }) : null;
  const bar = lead ? M.snap(lead.lead + 16) : 48, h = M.snap(bar + pad * 2 + line.height);
  const y = M.snap(spec.y ?? Math.min(kit.place(h, 700), T.floor - h));
  const yLine = y + bar + pad + line.lead / 2;
  const title = lead ? (c, cx, cy) => kit.drawText(c, lead, { x0: cx - lead.width / 2 - 4, x1: cx + lead.width / 2 + 4, y: cy, color: P.paper, key: P.paper }) : null;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = M.step(t);
      M.dissolve(ctx, span(ts, at, at + T.dur.open), [x, y, w + 16, h + 16],
        (c) => M.plate(c, P, x, y, w, h, { bar, gapW: lead ? lead.width : 0, title: title && ((cx, cy) => title(c, cx, cy)) }));
      if (ts >= at + T.dur.open) kit.drawText(ctx, line, { x0: x + pad, x1: x + w - pad, y: yLine, align: 'start', color: P.paper, key: P.paper,
        each: M.typed(ts, at + T.dur.open + 0.05, T.dur.word, P, line.size, true, P.onAccent) });
    },
  };
}
