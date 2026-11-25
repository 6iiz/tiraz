// Before and after on one canvas. The label sits on top in grey and the old value under it in grey; when the walk settles a stroke of
// the ink is brushed through the old value (it stays readable under the stroke). Then the new value is painted from the reading side
// below it, bigger, in the key colour, and an accent stroke is brushed under it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const G = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { E } = await import(look.base + 'motion.js');
  const A = G.area, maxW = A.x1 - A.x0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [nw] = kit.fitAll([asText(S.now)], { size: T.size.compare, weight: 800, maxW, single: true, where: 'the new value' });
  const ws = kit.fit(asText(S.was), { size: Math.round(nw.size * 0.72), weight: 700, maxW, single: true, where: 'the old value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW, single: true, where: 'the compare label' }) : null;
  const g1 = 26, g2 = nw.size * 0.5, hB = (label ? label.lead + g1 : 0) + ws.lead + g2 + nw.lead;
  const top = A.cy - hB / 2;
  const lab = label ? await G.rows(label, { y: top + label.lead / 2, color: G.P.grey }) : [];
  const yW = top + (label ? label.lead + g1 : 0) + ws.lead / 2, yN = yW + ws.lead / 2 + g2 + nw.lead / 2;
  const was = (await G.rows(ws, { y: yW, color: G.P.grey, key: G.P.grey }))[0];
  const now = (await G.rows(nw, { y: yN, color: G.P.key, key: G.P.key }))[0];
  const strike = G.bar({ x0: was.x0 - 8, x1: was.x1 + 8, y: yW + ws.size * 0.06, h: ws.size * 0.12, color: G.P.ink, z: 0.6 });
  const under = G.bar({ x0: now.x0, x1: now.x1, y: yN + nw.size * 0.8, h: nw.size * 0.15 });
  const tS = at + T.walk + 0.15, tN = at + T.walk + 0.6;
  return {
    duration: d,
    draw(ctx, t) {
      const walking = G.pose(t, at, d); G.lamp(t, at, d);
      for (const l of [...lab, was]) { G.wipe(l, 1); G.rec(l, walking); }
      G.wipe(strike, E(span(t, tS, tS + T.dur.wipe)));
      G.wipe(now, E(span(t, tN, tN + T.dur.wipe + 0.05))); G.rec(now, walking);
      G.wipe(under, E(span(t, tN + 0.38, tN + 0.38 + T.dur.wipe)));
      G.render(ctx);
    },
  };
}
