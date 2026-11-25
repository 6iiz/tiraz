// Before and after, in paper. The old value opens on a greyed, older paper; a thin ribbon of paper then unfolds across it from the
// reading side, striking it through, and the old sheet tips back towards the table, still readable. The new value opens below on
// the accent's paper, bigger, and flexes once when it lands. The label is a strip above.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, C = T.compare, D = T.dur, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 3 + Math.round(clock * 7) });
  const { E, EI, flex, DEG } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 20;
  const plain = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)).replace(/\*/g, '') + (S.unit ? ' ' + S.unit : '');
  const wasT = plain(S.was), nowT = plain(S.now);
  let size = T.size.compare;
  for (let tries = 0; tries < 6; tries++) {
    const widest = Math.max(W3.measure(wasT, { size: size * C.was }).width, W3.measure(`*${nowT}*`, { size }).width);
    if (widest <= maxW) break; size = Math.floor(size * maxW / widest);
  }
  const was = await W3.row(wasT, { size: Math.round(size * C.was), kind: 'old' });
  const now = await W3.row(`*${nowT}*`, { size });
  let label = null;
  if (S.label) {
    let ls = T.size.lead; const lw = W3.measure(S.label, { size: ls, weight: 600, whole: true }).width;
    if (lw > maxW) ls = Math.max(44, Math.floor(ls * maxW / lw));
    label = await W3.row(S.label, { size: ls, weight: 600, kind: 'lead', whole: true });
  }
  const gL = 34, gV = 46;
  const total = (label ? label.h + gL : 0) + was.h + gV + now.h;
  let y = kit.place(total, T.layout.centre);
  if (label) { label.place({ y }); y += label.h + gL; }
  was.place({ y }); const wy = y; y += was.h + gV;
  now.place({ y });

  // the strike: a ribbon of paper across the old value, at the middle of its ink, opening from the reading side
  const rw = was.width + 36, rh = Math.max(9, was.size * 0.1);
  const ribbon = W3.sheet({ texts: [''], kind: 'word', size: 10, w: rw, h: rh, asc: 0, padX: 0, padY: 0, panels: 7, decor: true });
  ribbon.front.map = null; ribbon.front.color = new W3.THREE.Color(W3.P.strike); ribbon.front.needsUpdate = true;
  ribbon.place(540 - rw / 2, wy + was.h * 0.52 - rh / 2);
  const u = D.unfold, ws = was.sheets, ns = now.sheets;
  return {
    duration: d,
    draw(ctx, t) {
      if (label) label.sheets[0].pose(span(t, at, at + u));
      const back = EI(span(t, at + C.back, at + C.back + 0.32));
      ws.forEach((sh, k) => sh.pose(span(t, at + C.wasAt + k * 0.08, at + C.wasAt + k * 0.08 + u), { z: -back * C.sink, tilt: back * C.tilt * DEG }));
      ribbon.pose(span(t, at + C.strike, at + C.strike + 0.34), { wave: 0.6, z: 6 - back * C.sink + was.h * 0.5 * Math.sin(back * C.tilt * DEG), rec: false });
      ns.forEach((sh, k) => {
        const a = at + C.now + k * 0.08, tf = a + u + 0.08, q = span(t, tf, tf + D.flex);
        sh.pose(span(t, a, a + u), { flex: flex(q) * T.fold.flex * DEG, z: E(span(t, tf, tf + 0.22)) * T.z.key });
      });
      W3.draw(ctx, t);
    },
  };
}
