// A number, poured like a measuring glass: one long stream fills a giant numeral in the key liquid, and the number counts up with
// the level (the digits under the liquid change as it rises), landing on the value as the mould is full. It sets with a wobble,
// drops grow on its feet, and the label is poured under it. At the end both drain.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 2 + Math.round((clock ?? 0) * 3) });
  const { fill } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 40, N = 6;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const strs = [...new Set(Array.from({ length: N + 1 }, (_, k) => text(countValue(0, S.value, k / N, ease.linear))))];
  const final = text(S.value);
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW, minScale: 0.9, where: 'the count label' });
  const labelRows = label.rows.map((r) => r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' '));
  // the numerals: every value the count shows, one solid each, all the size of the final value
  const nums = [];
  for (const s of strs) nums.push(await W3.slab(s, { size: T.size.count, weight: 900, role: 'key', ltr: true, maxW, drops: 2 }));
  const big = nums[nums.length - 1], sc = Math.min(...nums.map((n) => n.s));
  nums.forEach((n) => { n.s = sc; n.root.scale.setScalar(sc); });
  const hNum = big.h * sc, hLab = labelRows.length * label.size * T.gap.item, gap = 70;
  const top = kit.place(hNum + gap + hLab, T.layout.centre);
  nums.forEach((n) => W3.place(n, { y: top + hNum / 2 }));
  nums.forEach((n) => n.words.forEach((w) => { w.sx = big.words[0].sx; }));
  const labs = [];
  for (let r = 0; r < labelRows.length; r++) {
    const sl = await W3.slab(labelRows[r], { size: label.size, weight: 700, role: 'ink', drops: 1 });
    W3.place(sl, { y: top + hNum + gap + (r + 0.5) * label.size * T.gap.item }); labs.push(sl);
  }
  const climb = 1.35, out0 = d - T.dur.out;
  const pn = nums.map((n) => W3.pour(n, { t0: at, step: 0, fall: T.pour.fall * 1.2, fill: climb, out0, out1: d }));
  const tl = at + T.pour.fall * 1.2;
  let k = 0;
  const pl = labs.map((sl, r) => { const p = W3.pour(sl, { t0: at + 0.45 + k * 0.07, step: 0.07, out0, out1: d, drop: r === labs.length - 1 }); k += sl.words.length; return p; });
  return {
    duration: d,
    draw(ctx, t) {
      const f = fill(span(t, tl, tl + climb)), cur = f >= 1 ? strs.length - 1 : strs.indexOf(text(countValue(0, S.value, Math.floor(f * N) / N, ease.linear)));
      nums.forEach((n, i) => { n.root.visible = i === cur; if (i === cur) pn[i](t); else n.words.forEach((w) => { w.stream.visible = w.head.visible = false; w.anchors.forEach((a) => { a.mesh.visible = false; }); }); });
      pl.forEach((p) => p(t));
      W3.draw(ctx, t);
    },
  };
}
