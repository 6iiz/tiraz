// A line: the blocks under its rows rise into a stage that follows the text's rag, then each word slides out of a gate on its
// grid row, in reading order, and locks. The key run is lifted on an ink block and set in the floor's colour. The accent unit
// stands on the next row, at the far end. At the end the stage sinks and the words sink into the floor with it.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; this style always leaves by sinking)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, HT = T.height, at = spec.at ?? 0, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 1 });
  const { E } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left;
  const asRows = (f) => f.rows.map((r) => r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' '));
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, lead: 1.55 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9 }) : null;
  const texts = [...(lead ? asRows(lead).map((s) => ({ s, lead: true })) : []), ...asRows(line).map((s) => ({ s, lead: false }))];
  const n = texts.length, j0 = Math.max(0, Math.min(W3.rows - n - 1, Math.round(((spec.y ?? 700) - SAFE.top) / W3.P - n / 2)));
  const slabs = [];
  for (let r = 0; r < n; r++) {
    const x = texts[r];
    const sl = await W3.slab(x.s, x.lead ? { size: lead.size, weight: T.weight.lead, depth: T.depth.lead, color: W3.tone.grey }
      : { size: line.size, weight: T.weight.line });
    W3.place(sl, { row: j0 + r }); slabs.push(sl);
  }
  const words = slabs.reduce((s, sl) => s + sl.words.length, 0);
  const step = Math.min(T.dur.step, 0.36 / Math.max(1, words - 1)), slide = T.dur.slide, out0 = d - T.dur.out;
  let k = 0;
  const plan = slabs.map((sl, r) => { const o = { t0: at + 0.12 + k * step, step, slide, keyGap: 0.05, out0, out1: d, r }; k += sl.words.length; return o; });
  const up = (r) => (t) => HT.rest + (HT.stage - HT.rest) * E(span(t, at + r * 0.05, at + r * 0.05 + 0.24)) * (1 - E(span(t, out0 - 0.02, d - 0.05)));
  slabs.forEach((sl, r) => {
    plan[r].z = up(r);
    for (let i = sl.i0; i <= sl.i1; i++) W3.stage(i, sl.row, up(r));
  });
  W3.reserve(0, T.grid.cols - 1, j0, j0 + n);
  const ui = W3.rtl ? 0 : T.grid.cols - 1, uj = j0 + n, uc = W3.cell(ui, uj);
  W3.stage(ui, uj, () => 0);
  return {
    duration: d,
    draw(ctx, t) {
      slabs.forEach((sl, r) => W3.pose(sl, t, plan[r]));
      const hu = (HT.stage + 24) * E(span(t, at + 0.3, at + 0.6)) * (1 - E(span(t, out0, d)));
      W3.placeUnit(uc.x, uc.y, hu);
      W3.draw(ctx, t);
    },
  };
}
