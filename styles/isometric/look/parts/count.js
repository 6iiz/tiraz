// A number: an accent column extrudes out of a floor slab, course by course, while the number counts up beside it; a leader line runs
// from the top of the column to the number, so the figure reads as the column's label. The label sits under the number.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, u = T.unit;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const rtl = kit.rtl, room = 560, lroom = 610;                                     // the text side: the reading side of the frame
  const tx0 = rtl ? SAFE.right - lroom : SAFE.left, tx1 = rtl ? SAFE.right : SAFE.left + lroom;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 100) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: lroom, minScale: 0.8, where: 'the count label' });
  const yNum = 560, yLabel = yNum + size * 0.62 + 30 + label.lead / 2;
  // the column stands on the other side: a 3 x 3 footprint on a 5 x 5 slab
  const cx = rtl ? 270 : W - 270, oy = 960, P = M.project(cx - 0.0 * u, oy, u);
  const hMax = 10;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.E(span(t, d - T.dur.out - 0.05, d)), p = span(t, at + 0.15, at + 1.5);
      const slab = M.G(span(t, at, at + T.dur.build)) * (1 - out);
      if (slab > 0) {
        M.block(ctx, P, -1, -1, 0, 5, 5, 0.5 * slab, pal.floor);
        const h = hMax * M.E(p) * (1 - out);
        M.block(ctx, P, 0, 0, 0.5 * slab, 3, 3, Math.max(0.05, h), pal.hot, true);
        const [lx, ly] = P(3, 0, 0.5 * slab + h), nx = rtl ? SAFE.right - kit.numberWidth(text(countValue(0, S.value, p)), size, 900, p) - 24
          : SAFE.left + kit.numberWidth(text(countValue(0, S.value, p)), size, 900, p) + 24;
        M.leader(ctx, [[lx, ly], [lx + (rtl ? 40 : -40), ly], [nx, yNum]], span(t, at + 0.3, at + 0.8) * (1 - out), pal.line);
      }
      ctx.save();
      const a = M.E(span(t, at, at + T.dur.in)); if (a <= 0) { ctx.restore(); return; }
      ctx.globalAlpha = a * (1 - out); ctx.translate(0, (1 - a) * 40 - out * 30);
      kit.number(ctx, text(countValue(0, S.value, p)), { x: rtl ? SAFE.right : SAFE.left, y: yNum, size, color: pal.text, align: rtl ? 'right' : 'left', settle: p });
      ctx.restore();
      kit.drawText(ctx, label, { x0: tx0, x1: tx1, y: yLabel, align: 'start', color: pal.muted,
        each: (w, i, box, c) => {
          const t0 = at + 0.5 + i * T.dur.stagger;
          if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, label.size) === false) return false;
          if (M.leave(c, span(t, d - T.dur.out, d), box, label.size) === false) return false;
        } });
    },
  };
}
