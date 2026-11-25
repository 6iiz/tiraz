// A line: a canvas on the gallery wall with the line painted on it, already hung when the visitor walks up (so a hook is whole on the
// first frame). The lead sits above it in grey, smaller. As the walk settles, a stroke of the accent is brushed under the key word from
// the reading side, and the picture light comes up. At the end the visitor walks on to the next canvas.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; this style always walks on)
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const G = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { E } = await import(look.base + 'motion.js');
  const A = G.area, maxW = A.x1 - A.x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.96, where: 'the lead-in' }) : null;
  const gap = lead ? line.size * 0.42 : 0, hB = (lead ? lead.height : 0) + gap + line.height;
  const top = Math.max(A.y0, A.cy - hB / 2 - line.size * 0.1);
  const leads = lead ? await G.rows(lead, { y: top + lead.lead / 2, color: G.P.grey }) : [];
  const rows = await G.rows(line, { y: top + (lead ? lead.height + gap : 0) + line.lead / 2 });
  const strokes = [];
  rows.forEach((r) => r.keys.forEach((k) => strokes.push(G.bar({ x0: k.x0, x1: k.x1, y: k.y + k.size * 0.8, h: k.size * 0.15 }))));
  const sT = (i) => at + 0.42 + i * 0.12;
  return {
    duration: d,
    draw(ctx, t) {
      const walking = G.pose(t, at, d); G.lamp(t, at, d);
      for (const l of [...leads, ...rows]) { G.wipe(l, 1); G.rec(l, walking); }
      strokes.forEach((b, i) => G.wipe(b, E(span(t, sT(i), sT(i) + T.dur.wipe))));
      G.render(ctx);
    },
  };
}
