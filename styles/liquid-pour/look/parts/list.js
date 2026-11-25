// A list: one row per beat. A bead of the key liquid falls from above the frame and splats on the row's reading-start side, then
// the item is poured beside it, word by word. The optional title is poured first, in the muted liquid. Drops from the last row fall
// into the pool. At the end every mould drains and the beads shrink away.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 4 + Math.round((clock ?? 0) * 3) });
  const rtl = W3.rtl, out0 = d - T.dur.out, bead = 92;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: SAFE.right - SAFE.left - 40, single: true, where: 'the list title' }) : null;
  const fits = kit.fitAll(items, { size: T.size.item, weight: 800, maxW: SAFE.right - SAFE.left - bead - 40, single: true, where: 'a list item' });
  const rowH = fits[0].size * T.gap.item, titleH = title ? title.size * 2.0 : 0;
  const top = kit.place(titleH + rowH * items.length, T.layout.centre);
  const poses = [];
  if (title) {
    const sl = await W3.slab(spec.says.title, { size: title.size, weight: 700, role: 'lead', drops: 1 });
    W3.place(sl, { y: top + title.size * 0.8 });
    poses.push(W3.pour(sl, { t0: at - 0.1, step: 0.06, out0, out1: d }));
  }
  const x0 = rtl ? SAFE.left + 20 : SAFE.left + bead, x1 = rtl ? SAFE.right - bead : SAFE.right - 20;
  for (let k = 0; k < items.length; k++) {
    const y = top + titleH + (k + 0.5) * rowH, tb = at + 0.25 + k * T.dur.beat;
    const sl = await W3.slab(items[k], { size: fits[k].size, weight: 800, drops: 1, maxW: x1 - x0 });
    W3.place(sl, { y, x0, x1, align: 'start' });
    const r = Math.min(24, fits[k].size * 0.24);
    poses.push(W3.bead({ x: rtl ? SAFE.right - bead / 2 + 8 : SAFE.left + bead / 2 - 8, y, r, t0: tb, out0: out0 + k * 0.03, out1: d }));
    poses.push(W3.pour(sl, { t0: tb - 0.04, step: Math.min(0.07, 0.24 / Math.max(1, sl.words.length - 1)), out0, out1: d, drop: k === items.length - 1 }));
  }
  return {
    duration: d,
    draw(ctx, t) {
      poses.forEach((p) => p(t));
      W3.draw(ctx, t);
    },
  };
}
