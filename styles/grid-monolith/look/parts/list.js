// A list: up to five rows on the grid. Each row's stage rises on the beat, its index (mono, extruded) seats in the far cell, and
// the item slides out of its gate along the row and locks. The accent unit lands under the last row. Rows sink together at the end.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, HT = T.height, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 4 });
  const { E } = await import(look.base + 'motion.js');
  const cols = T.grid.cols, P = W3.P, maxW = SAFE.right - SAFE.left, out0 = d - T.dur.out;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead + 4, weight: 600, maxW: maxW - 30, single: true, where: 'the list title' }) : null;
  const fit = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: maxW - P - 40, single: true, where: 'a list item' });
  const n = items.length + (title ? 1 : 0), j0 = Math.max(0, Math.min(W3.rows - n, Math.round((720 - SAFE.top) / P - n / 2)));
  const up = (t0) => (t) => HT.rest + (HT.stage - HT.rest) * E(span(t, t0, t0 + 0.24)) * (1 - E(span(t, out0 - 0.02, d - 0.05)));
  const rows = [];
  if (title) {
    const sl = await W3.slab(spec.says.title, { size: title.size, weight: 600, depth: T.depth.lead, color: W3.tone.grey });
    W3.place(sl, { row: j0 }); const z = up(at - 0.15);
    for (let i = sl.i0; i <= sl.i1; i++) W3.stage(i, sl.row, z);
    rows.push({ sl, o: { t0: at, step: T.dur.step, slide: T.dur.slide, out0, out1: d, z } });
  }
  const ix = W3.rtl ? 0 : cols - 1, idx = [];
  for (let k = 0; k < items.length; k++) {
    const j = j0 + (title ? 1 : 0) + k, t0 = at + 0.3 + k * T.beat, z = up(t0 - 0.22);
    const sl = await W3.slab(items[k], { size: fit[k].size, weight: T.weight.item, maxW: maxW - P - 40 });
    W3.place(sl, { row: j, x0: W3.rtl ? SAFE.left + P + 10 : SAFE.left, x1: W3.rtl ? SAFE.right : SAFE.right - P - 10 });
    for (let i = sl.i0; i <= sl.i1; i++) W3.stage(i, j, z);
    const num = await W3.slab(String(k + 1).padStart(2, '0'), { size: T.size.index, weight: 600, face: 'mono', depth: T.depth.lead, color: W3.tone.grey, ltr: true });
    W3.place(num, { row: j, x0: SAFE.left + ix * P, x1: SAFE.left + (ix + 1) * P, align: 'center' });
    W3.stage(ix, j, z);
    rows.push({ sl, o: { t0, step: Math.min(T.dur.step, 0.3 / Math.max(1, sl.words.length - 1)), slide: T.dur.slide, keyGap: 0.04, out0, out1: d, z } });
    idx.push({ num, z, t0 });
  }
  W3.reserve(0, cols - 1, j0, j0 + n);
  const uj = j0 + n, uc = W3.cell(ix, uj), tu = at + 0.3 + (items.length - 1) * T.beat + 0.35;
  W3.stage(ix, uj, () => 0);
  return {
    duration: d,
    draw(ctx, t) {
      rows.forEach(({ sl, o }) => W3.pose(sl, t, o));
      idx.forEach(({ num, z, t0 }) => W3.still(num, t, { z: z(t), out0, out1: d, show: t >= t0 - 0.05, decor: true }));
      W3.placeUnit(uc.x, uc.y, HT.unit * E(span(t, tu, tu + 0.25)) * (1 - E(span(t, out0, d))));
      W3.draw(ctx, t);
    },
  };
}
