// A number: a big, fat number in the accent clay drops onto the table and then counts up, pose by pose. Each digit is its own clay
// piece; when a digit changes it is swapped for the next one, which lands with a little squash, as an animator swaps a mouth.
// The label follows in dark clay underneath. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, dec = spec.decimals ?? 0;
  const world = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { POSE, FALL, plop } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 60;
  const pre = S.prefix ?? '', suf = S.suffix ?? '';
  let size = T.size.count; while (kit.numberWidth(pre + kit.fmt(S.value, dec) + suf, size, 900, 1) * 1.08 > maxW && size > 120) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, where: 'the count label' });
  const yNum = kit.place(size * 0.8 + 40 + label.height, 700) + size * 0.4, yLabel = yNum + size * 0.4 + 40 + label.lead / 2;

  // the pieces: one per possible character in each slot of the number, built once
  const final = kit.fmt(S.value, dec), chars = new Set([...final, ...kit.fmt(0, dec)]);
  for (let i = 0; i < 10; i++) chars.add(kit.fmt(i, 0));                 // every digit of the brand's digit system
  const proto = new Map();
  for (const c of chars) proto.set(c, await world.word(c, { size, weight: 900, color: world.accent, fat: false }));
  const cell = Math.max(...[...proto].filter(([c]) => /[0-9٠-٩]/.test(c)).map(([, p]) => p.width));
  const slots = [...final].map((_, j) => { const m = new Map(); for (const [c, p] of proto) { const o = p.obj.clone(); world.scene.add(o); o.visible = false; m.set(c, o); } return m; });
  for (const p of proto.values()) p.obj.visible = false;
  const preP = pre ? await world.word(pre, { size: Math.round(size * 0.6), weight: 900, color: world.accent }) : null;
  const sufP = suf ? await world.word(suf, { size: Math.round(size * 0.6), weight: 900, color: world.accent }) : null;
  const L = await world.text(label, { x0: SAFE.left, x1: SAFE.right, y: yLabel });
  const cw = (c) => (/[0-9٠-٩]/.test(c) ? cell : proto.get(c).width);
  const run = at + FALL + POSE, runEnd = run + 1.4, out = d - 6 * POSE;
  const valueAt = (t) => { const p = span(t, run, runEnd); return p >= 1 ? S.value : S.value * (1 - (1 - p) ** 3); };
  const str = (t) => kit.fmt(valueAt(t), dec);
  return {
    duration: d,
    draw(ctx, t) {
      world.frame(ctx, t, (tq, k) => {
        const s = str(tq), before = str(tq - POSE), gap = size * 0.08;
        const parts = [...(preP ? [{ w: preP.width, p: preP }] : []), ...[...s].map((c, j) => ({ w: cw(c), c, j })), ...(sufP ? [{ w: sufP.width, p: sufP }] : [])];
        const total = parts.reduce((a, q) => a + q.w, 0) + (preP ? gap : 0) + (sufP ? gap : 0);
        let x = W / 2 - total / 2;                                   // a number reads left to right
        const whole = plop(tq, at, 1.5), shown = [];
        slots.forEach((m) => m.forEach((o) => { o.visible = false; }));
        for (const q of parts) {
          const cx = x + q.w / 2; x += q.w + (q.p ? gap : 0);
          const o = q.p ? q.p.obj : slots[q.j].get(q.c), rest = world.at(cx, yNum, size * 0.15).setZ(0);
          const swap = !q.p && s.length === before.length && before[q.j] !== q.c && tq > run;
          world.drop({ obj: o, rest, i: q.j ?? 9 }, tq, k, at, { t1: out, amp: 1.5 });
          if (swap) { o.scale.x *= 1.1; o.scale.y *= 0.84; o.scale.z *= 0.8; }
          if (!whole.on) o.visible = false; else shown.push(o);
        }
        L.pieces.forEach((p, i) => world.drop(p, tq, k, at + 0.5 + i * POSE, { t1: out + i * POSE * 0.5 }));
        return [[shown, s], ...L.rows.map((r) => [r.pieces.map((p) => p.obj), r.text])];
      });
    },
  };
}
