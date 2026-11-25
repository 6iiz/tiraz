// A line: each word is poured in reading order. A thin stream falls behind it from above the frame, the mould fills from the
// bottom, the word sets with a soft wobble and drops grow on its feet; drops from the lowest row fall into the pool. The key
// word (*…*) is poured in the key liquid. The lead, smaller and in a muted liquid, is poured first. At the end every mould drains.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; this style always leaves by draining)
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 1 + Math.round((clock ?? 0) * 3) });
  const maxW = SAFE.right - SAFE.left - 40;
  const asRows = (f) => f.rows.map((r) => r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' '));
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: 800, maxW, minScale: 0.62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: 700, maxW, minScale: 0.92, where: 'the lead-in' }) : null;
  const rows = [...(lead ? asRows(lead).map((s) => ({ s, lead: true })) : []), ...asRows(line).map((s) => ({ s, lead: false }))];
  const hOf = (r) => (r.lead ? lead.size * T.gap.lead : line.size * T.gap.line);
  const total = rows.reduce((a, r) => a + hOf(r), 0) + (lead ? line.size * 0.15 : 0);
  let y = kit.place(total, spec.y ?? T.layout.centre);
  const slabs = [];
  for (const r of rows) {
    const sl = await W3.slab(r.s, r.lead ? { size: lead.size, weight: 700, role: 'lead', drops: 1 } : { size: line.size, weight: 800 });
    const h = hOf(r); W3.place(sl, { y: y + h / 2 }); y += h + (r.lead && !rows[rows.indexOf(r) + 1]?.lead ? line.size * 0.15 : 0);
    slabs.push(sl);
  }
  // every word is full within T.pour.window of `at` (so a hook at -0.8 is whole on frame 0)
  const n = slabs.reduce((s, sl) => s + sl.words.length, 0);
  const step = Math.min(T.pour.step, (T.pour.window - T.pour.fall - T.pour.fill) / Math.max(1, n - 1));
  const out0 = d - T.dur.out;
  let k = 0;
  const poses = slabs.map((sl, i) => {
    const p = W3.pour(sl, { t0: at + k * step, step, out0, out1: d, drop: i === slabs.length - 1 });
    k += sl.words.length; return p;
  });
  return {
    duration: d,
    draw(ctx, t) {
      poses.forEach((p) => p(t));
      W3.draw(ctx, t);
    },
  };
}
