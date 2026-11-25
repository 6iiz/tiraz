// A list: one course of cubes per item, laid on the beat. Each row starts with a single big brick in the key colour dropping onto
// its spot at the reading side; then the item's cubes are thrown in after it and snap. The optional title is set flat above.
// At the end the rows lift off in reading order, all together.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 4 });
  const { builder, rec } = await import(look.base + 'cubes.js');
  const { out3, arrive, leave, snap } = await import(look.base + 'motion.js');
  const rtl = W3.rtl, room = 78, maxW = SAFE.right - SAFE.left - room - 10, out0 = d - T.dur.out;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const fit = kit.fitAll(items, { size: T.size.item, weight: 800, maxW, single: true, where: 'a list item' });
  const rowH = fit[0].size * 1.62, tGap = 40, total = (title ? title.lead + tGap : 0) + rowH * items.length;
  const top = kit.place(total, 750), yT = top + (title ? title.lead / 2 : 0), y0 = top + (title ? title.lead + tGap : 0) + rowH / 2;
  const x0 = rtl ? SAFE.left : SAFE.left + room, x1 = rtl ? SAFE.right - room : SAFE.right;
  const pitch = W3.pitch(fit[0].size), sets = [];
  for (let k = 0; k < items.length; k++) sets.push(await W3.voxels(fit[k], { x0, x1, y: y0 + k * rowH, align: 'start', pitch }));
  const nCells = sets.reduce((s, x) => s + x.cells.length, 0), pool = W3.pool(nCells + items.length);
  let base = 0;
  const rows = sets.map((set, k) => {
    const t0 = at + 0.28 + k * T.dur.beat, b = builder(W3, set, { pool, base, t0: t0 + 0.08, window: 0.26, out0: out0 + k * 0.05, seed: 4 + k });
    base += set.cells.length; return { set, b, t0 };
  });
  const bi = nCells, bs = pitch * 4.4, bx = rtl ? SAFE.right - room / 2 + 6 : SAFE.left + room / 2 - 6;
  rows.forEach((r, k) => pool.color(bi + k, W3.P.key));
  return {
    duration: d,
    draw(ctx, t) {
      rows.forEach((r, k) => {
        const st = r.b.at(t); rec(W3, kit, r.set, st);
        const c = { gx: 3 + k, gy: 9 - k, x: bx, y: y0 + k * rowH }, p = (t - (r.t0 - 0.06)) / 0.3;
        if (p <= 0) { pool.hide(bi + k); return; }
        const h = bs * 0.8;
        let x = c.x, y = c.y, z = h / 2, hh = h, rx = 0, ry = 0, rz = 0;
        if (p < 1) { const a = arrive(p, c, W3.dir, { ...T.fly, side: 0, spread: 0, z: 700 }, 9); z += a.z; rx = a.rx * 0.25; ry = a.ry * 0.25; }
        else { hh = h * (1 - 0.3 * snap(span(t, r.t0 + 0.24, r.t0 + 0.37))); z = hh / 2; }
        const pe = (t - (out0 + k * 0.05)) / T.leave.dur;
        if (pe > 0) { if (pe >= 1) { pool.hide(bi + k); return; } const l = leave(pe, c, W3.dir, T.leave, 9); x += l.dx; y += l.dy; z += l.z; rx += l.rx; ry += l.ry; }
        pool.put(bi + k, x, y, z, bs, hh, rx, ry, rz);
      });
      pool.commit();
      W3.draw(ctx, t);
      if (title) {
        const pin = out3(span(t, at, at + 0.3)), pout = span(t, out0, out0 + 0.3);
        if (pout < 1) W3.flat(ctx, title, { y: yT, align: 'start', dy: (1 - pin) * 26 - pout * pout * 40, alpha: Math.min(1, pin * 3) * (1 - pout) });
      }
    },
  };
}
