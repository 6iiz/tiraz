// A number in thick paint: the knife lays a broad slab of lighter paint, the figure counts up on it in raised paint, and when it lands
// one heavy stroke of the accent is dragged under it from the reading side. The label is laid below on the ground by its own pass.
// The whole thing is scraped off at the end. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const pw = SAFE.right - SAFE.left - 40, room = pw - 120;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 40, minScale: 0.8, where: 'the count label' });
  const ph = size * 1.3, top = kit.place(ph + 90 + label.height, 680), px = SAFE.left + 20, yNum = top + ph / 2 + size * 0.04;
  const slab = M.plane(pw, ph, P.plane, [P.paint, P.ground, P.accent], 77, { row: 60 });
  const bar = M.plane(Math.min(pw - 60, kit.numberWidth(text(S.value), size, 900, 1) + 120), 34, P.accent, [P.paint, P.ground], 91, { row: 34, pad: 16 });
  const yBar = top + ph - 26, yLabel = top + ph + 70 + label.lead / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - T.dur.out, d), p = span(t, at + 0.3, at + 1.3);
      M.knife(ctx, { x: px, y: top, w: pw, h: ph }, span(t, at, at + T.dur.pass), q, rtl, () => {
        M.drawPlane(ctx, slab, px, top);
        M.reliefNumber(kit, ctx, text(countValue(0, S.value, p, M.LAND)), { x: W / 2, y: yNum, size, color: P.paint, surface: P.plane, settle: p });
      }, P.plane2);
      const bx = rtl ? px + pw - 30 - bar.w : px + 30;
      M.knife(ctx, { x: bx, y: yBar, w: bar.w, h: bar.h }, span(t, at + 1.2, at + 1.5), q, rtl, () => M.drawPlane(ctx, bar, bx, yBar), P.lift(P.accent, 0.25));
      label.rows.forEach((_, r) => {
        const yy = yLabel + r * label.lead;
        M.knife(ctx, { x: SAFE.left - 20, y: yy - label.lead / 2, w: SAFE.right - SAFE.left + 40, h: label.lead }, span(t, at + 0.55 + r * 0.15, at + 0.55 + r * 0.15 + T.dur.pass), q, rtl,
          () => M.relief(kit, ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.paint, surface: P.ground, each: (w, i, b) => b.row === r }), null);
      });
    },
  };
}
