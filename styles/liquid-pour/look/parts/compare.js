// Before and after, as liquid: the old value is poured in the muted liquid and sets; then it starts to melt (its top sags, its
// foot spreads, long drops stretch from it) and stays legible while the new value is poured under it in the key liquid and sets
// firm. The label is poured first, small. At the end everything drains. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 3 + Math.round((clock ?? 0) * 3) });
  const { E } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 40, out0 = d - T.dur.out;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const plain = (s) => s.replace(/\*/g, '');
  const [fw, fn] = kit.fitAll([plain(asText(S.was)), plain(asText(S.now))], { size: T.size.compare, weight: 800, maxW, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 700, maxW, single: true, where: 'the compare label' }) : null;
  const sWas = Math.round(fw.size * 0.86), hL = label ? label.size * 1.9 : 0, hW = sWas * 1.5, hN = fn.size * 1.5;
  const top = kit.place(hL + hW + hN + 30, T.layout.centre);
  const lab = label ? await W3.slab(S.label, { size: label.size, weight: 700, role: 'lead', drops: 1 }) : null;
  const was = await W3.slab(plain(asText(S.was)), { size: sWas, weight: 800, role: 'old', drops: 3 });
  const now = await W3.slab(plain(asText(S.now)), { size: fn.size, weight: 800, role: 'key', drops: 2 });
  if (lab) W3.place(lab, { y: top + label.size * 0.75 });
  W3.place(was, { y: top + hL + hW / 2 });
  W3.place(now, { y: top + hL + hW + 30 + hN / 2 });
  const mT = at + 0.85, nowT = at + 1.2;
  const melt = (t) => 0.55 * E(span(t, mT, mT + 0.7)) + 0.15 * span(t, mT + 0.7, d);
  const poses = [
    ...(lab ? [W3.pour(lab, { t0: at - 0.1, step: 0.06, out0, out1: d })] : []),
    W3.pour(was, { t0: at + 0.1, step: 0.07, out0, out1: d, melt }),
    W3.pour(now, { t0: nowT, step: 0.07, fill: 0.36, out0, out1: d, drop: true }),
  ];
  return {
    duration: d,
    draw(ctx, t) {
      poses.forEach((p) => p(t));
      W3.draw(ctx, t);
    },
  };
}
