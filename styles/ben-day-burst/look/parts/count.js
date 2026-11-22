// A number: one big print. Its hero is a single giant dot of paper on the dot field, and the numeral sits in it in the key colour.
// The print is pulled again four times in quick succession, the blade crossing it each time with the number a step higher,
// so the count climbs print by print. The label is printed below by the blade. spec: { duration, at?, decimals?,
// says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 20, minScale: 0.88, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const top = Math.max(900, kit.place(label.height, 1120)), r = { x: 40, y: 40, w: W - 80, h: top - 60 - 40 };
  const R = Math.min(r.w, r.h) * 0.36, cx = W / 2, cy = Math.max(SAFE.top + R * 0.62, r.y + r.h / 2);
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > R * 1.7 && size > 90) size -= 8;
  const N = 4, every = 0.3, t1 = at + 0.25;   // one colourway: each step is a fresh pull of the same print
  const value = (k) => countValue(0, S.value, k / N, (x) => x);
  const tile = (k, t0, t, under = false) => M.printTile(ctx0, r, P.ways[0], { t, t0, rtl, fixed: k > 0, dots: ground.dots, keyC: P.night, paperC: P.paper, step: T.dur.step * 0.7, plate: T.dur.plate * 0.8,
    extra: under ? null : (c) => {
      c.save(); c.fillStyle = P.paper; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = P.night; c.lineWidth = 10; c.stroke(); c.restore();
      kit.number(c, text(value(k)), { x: cx, y: cy, size, color: P.night, align: 'center', settle: k / N });
    } });
  let ctx0 = null;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t); ctx0 = ctx;
      const n = t < t1 ? 0 : Math.min(N, Math.floor((t - t1) / every) + 1);
      if (n > 0) tile(n - 1, -1e9, 1e9, true);
      tile(n, n === 0 ? at : t1 + (n - 1) * every, t);
      M.pullText(ctx, kit, label, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: top + label.lead / 2, t, t0: at + 0.35, d: T.dur.pull, P, align: 'center' });
    },
  };
}
