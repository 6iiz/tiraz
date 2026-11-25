// A number: one large sheet of the accent's paper, folded as a pleat of four panels. It stands up and then opens slowly, one crease
// at a time; each crease that snaps flat moves the printed number on by a quarter, so it lands on the value as the last panel lies
// down. Then it flexes once and settles higher. The label is a row of word sheets under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, C = T.count, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 2 + Math.round(clock * 7) });
  const { E, flex, panelQ, DEG } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 20, N = C.panels;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const vals = []; for (let k = 0; k <= N; k++) vals.push(text(countValue(0, S.value, k / N, ease.linear)));
  let size = T.size.count; const fw = Math.max(...vals.map((v) => kit.fit(v, { weight: 800, size, maxW: 1e5, single: true }).width));
  if (fw + size * 0.4 > maxW) size = Math.floor(size * maxW / (fw + size * 0.4));
  const num = await W3.counter(vals, { size, weight: 800, panels: N });

  let ls = T.size.label, rowsT;
  for (let tries = 0; tries < 6; tries++) {
    const lf = kit.fit(S.label, { size: ls, weight: 700, maxW: maxW * 0.8, minScale: 0.85, where: 'the count label' });
    ls = lf.size; rowsT = lf.rows.map((r) => r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' ').replace(/\*\s+\*/g, ' '));
    const widest = Math.max(...rowsT.map((t) => W3.measure(t, { size: ls, weight: 700 }).width));
    if (widest <= maxW) break; ls = Math.max(44, Math.floor(ls * maxW / widest));
  }
  const lf = { size: ls };
  const labels = []; for (const t of rowsT) labels.push(await W3.row(t, { size: lf.size, weight: 700 }));
  const g1 = 40, gR = T.sheet.rowGap;
  const total = num.h + g1 + labels.reduce((a, r) => a + r.h, 0) + gR * (labels.length - 1);
  let y = kit.place(total, T.layout.centre);
  num.place(540 - num.w / 2, y); y += num.h + g1;
  for (const r of labels) { r.place({ y }); y += r.h + gR; }

  const r0 = at + C.start, r1 = r0 + C.climb, tFlex = r1 + 0.08;
  const lsh = labels.flatMap((r) => r.sheets), u = T.dur.unfold;
  return {
    duration: d,
    draw(ctx, t) {
      const p = span(t, r0, r1);
      let done = 0; for (let k = 0; k < N; k++) if (panelQ(p, k, N, C.wave) >= 0.42) done++;
      num.show(p >= 1 ? N : done);
      const q = span(t, tFlex, tFlex + T.dur.flex);
      num.pose(p, { wave: C.wave, flex: flex(q) * T.fold.flex * DEG, z: E(span(t, tFlex, tFlex + 0.24)) * T.z.key });
      lsh.forEach((sh, k) => sh.pose(span(t, at + C.label + k * 0.09, at + C.label + k * 0.09 + u)));
      W3.draw(ctx, t);
    },
  };
}
