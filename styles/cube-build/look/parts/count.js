// A number built from big cubes. The first value is thrown in and snaps; then the number counts up in four steps, and at each step
// every cube hops (an arc and a quarter roll) from its place in the old numeral to its place in the new one: cubes split or merge
// as the digits need. At the last step the cubes turn the key colour. The label is set flat under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 2 });
  const { builder, rec, size } = await import(look.base + 'cubes.js');
  const { hop, pair, out3, snap, leave } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 40;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const valOf = (k) => text(countValue(0, S.value, k / 4, (x) => x));
  const vals = [...new Set([0, 1, 2, 3, 4].map(valOf))];
  const fits = kit.fitAll(vals, { size: T.size.count, weight: 900, maxW, single: true, where: 'the number' });
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, minScale: 0.9, where: 'the count label' });
  const gap = 40, total = fits.at(-1).size * 1.05 + gap + label.height, top = kit.place(total, 720);
  const yNum = top + fits.at(-1).size * 0.52, yLab = top + fits.at(-1).size * 1.05 + gap + label.lead / 2;
  const pitch = W3.pitch(fits.at(-1).size);
  const sets = [];
  for (const f of fits) sets.push(await W3.voxels(f, { y: yNum, align: 'center', pitch }));
  const steps = sets.length - 1, n = Math.max(...sets.map((s) => s.cells.length)) * 2;
  const pool = W3.pool(n), out0 = d - T.dur.out;
  const first = builder(W3, sets[0], { pool, t0: at, window: 0.3, out0: steps ? 1e9 : out0, seed: 2 });
  const tStep = (k) => at + 0.55 + (k - 1) * (1.05 / Math.max(1, steps)), hopDur = Math.min(0.34, 1.05 / Math.max(1, steps) + 0.04);
  const moves = []; for (let k = 1; k <= steps; k++) moves.push(pair(sets[k - 1].cells, sets[k].cells, (c) => c.x * 1e4 + c.y));
  const last = sets.at(-1);
  const colAt = (k) => (k === steps && steps > 0 ? W3.P.key : W3.P.ink);
  return {
    duration: d,
    draw(ctx, t) {
      let k = 0; for (let s = 1; s <= steps; s++) if (t >= tStep(s)) k = s;
      let st = { landed: 1, gone: 0 };
      if (k === 0) { st = first.at(t); for (let i = sets[0].cells.length; i < pool.n; i++) pool.hide(i); }
      else {
        const mv = moves[k - 1], p = (t - tStep(k)) / hopDur;
        mv.forEach((m, i) => {
          const { s, h } = size(W3, sets[k], m.to);
          if (p >= 1 && !m.stay) { pool.hide(i); return; }
          const q = Math.min(1, Math.max(0, p * 1.3 - (m.k / mv.length) * 0.3));
          const a = hop(q, m.from, m.to, 90 + (m.k % 5) * 18, m.k);
          const grow = m.stay ? 1 : 1 - q;
          let x = a.x, y = a.y, z = h / 2 + a.z, hh = h, rx = a.rx, ry = a.ry, rz = a.rz;
          if (p >= 1) { const sq = snap(span(t, tStep(k) + hopDur, tStep(k) + hopDur + 0.13)) * 0.3; hh = h * (1 - sq); z = hh / 2; rx = ry = rz = 0; }
          const pe = (t - (out0 + ((m.to.x - last.x0) / Math.max(1, last.x1 - last.x0)) * T.leave.window)) / T.leave.dur;
          if (k === steps && pe > 0) { if (pe >= 1) { pool.hide(i); return; } const l = leave(pe, m.to, W3.dir, T.leave, 2); x += l.dx; y += l.dy; z += l.z; rx += l.rx; ry += l.ry; }
          pool.color(i, q > 0.5 ? colAt(k) : colAt(k - 1));
          pool.put(i, x, y, z, s * grow, hh * grow, rx, ry, rz);
        });
        for (let i = mv.length; i < pool.n; i++) pool.hide(i);
        if (p < 0.9) st = { landed: 0, gone: 0 };
        else st = { landed: 1, gone: k === steps && t > out0 + 0.05 ? 1 : 0 };
      }
      pool.commit();
      W3.draw(ctx, t);
      rec(W3, kit, sets[k], st);
      const pin = out3(span(t, at + 0.35, at + 0.7)), pout = span(t, out0, out0 + 0.3);
      if (pout < 1) W3.flat(ctx, label, { y: yLab, color: W3.P.ink, dy: (1 - pin) * 26 - pout * pout * 40, alpha: Math.min(1, pin * 3) * (1 - pout) });
    },
  };
}
