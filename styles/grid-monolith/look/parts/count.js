// A number: a giant extruded numeral flush to the reading side, standing on a stage that climbs in four locked steps, one module
// at a time; the numeral changes with each step. The accent unit lands beside it with the last step. The label slides in under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, HT = T.height, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 2 });
  const { E, steps } = await import(look.base + 'motion.js');
  const cols = T.grid.cols, P = W3.P, maxW = SAFE.right - SAFE.left;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: maxW - 30, minScale: 0.9 });
  const labelRows = label.rows.map((r) => r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' '));
  const n = 2 + labelRows.length, j0 = Math.max(0, Math.min(W3.rows - n, Math.round((640 - SAFE.top) / P - n / 2)));
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const valOf = (k) => text(countValue(0, S.value, k / 4, (x) => x));
  const vals = [...new Set([0, 1, 2, 3, 4].map(valOf))];
  const room = { x0: W3.rtl ? SAFE.left + P + 10 : SAFE.left, x1: W3.rtl ? SAFE.right : SAFE.right - P - 10 };
  const nums = [];
  for (const v of vals) nums.push(await W3.slab(v, { size: T.size.count, weight: 900, depth: T.depth.number, ltr: true, maxW: room.x1 - room.x0 - 30 }));
  const s = nums.at(-1).s, yNum = SAFE.top + (j0 + 1) * P;
  nums.forEach((sl) => { sl.s = Math.min(sl.s, s); sl.root.scale.setScalar(sl.s); W3.place(sl, { y: yNum, x0: room.x0, x1: room.x1, row: j0 }); });
  const big = nums.at(-1), out0 = d - T.dur.out;
  const climb = (t) => steps(span(t, at, at + 1.6));
  const hNum = (t) => HT.rest + (HT.stage - HT.rest) * (0.25 + 0.75 * climb(t)) * E(span(t, at - 0.2, at)) * (1 - E(span(t, out0 - 0.02, d - 0.05)));
  for (let i = big.i0; i <= big.i1; i++) for (const j of [j0, j0 + 1]) W3.stage(i, j, hNum);
  const labels = [];
  for (let r = 0; r < labelRows.length; r++) {
    const sl = await W3.slab(labelRows[r], { size: label.size, weight: 600, depth: T.depth.lead, color: W3.tone.ink });
    W3.place(sl, { row: j0 + 2 + r }); labels.push(sl);
  }
  let k = 0;
  const plan = labels.map((sl, r) => {
    const z = (t) => HT.rest + (HT.stage - HT.rest) * E(span(t, at + 0.35 + r * 0.06, at + 0.6 + r * 0.06)) * (1 - E(span(t, out0 - 0.02, d - 0.05)));
    for (let i = sl.i0; i <= sl.i1; i++) W3.stage(i, sl.row, z);
    const o = { t0: at + 0.55 + k * T.dur.step, step: T.dur.step, slide: T.dur.slide, out0, out1: d, z }; k += sl.words.length; return o;
  });
  W3.reserve(0, cols - 1, j0, j0 + n - 1);
  const ui = W3.rtl ? 0 : cols - 1, uc = W3.cell(ui, j0 + 1); W3.stage(ui, j0 + 1, () => 0);
  return {
    duration: d,
    draw(ctx, t) {
      const p = span(t, at, at + 1.6), cur = vals.indexOf(valOf(p >= 1 ? 4 : Math.floor(p * 4)));
      nums.forEach((sl, i) => W3.still(sl, t, { z: hNum(t), out0, out1: d, show: i === cur && t >= at - 0.2 }));
      labels.forEach((sl, r) => W3.pose(sl, t, plan[r]));
      W3.placeUnit(uc.x, uc.y, HT.unit * E(span(t, at + 1.35, at + 1.6)) * (1 - E(span(t, out0, d))));
      W3.draw(ctx, t);
    },
  };
}
