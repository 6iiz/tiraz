// A number: a giant numeral slides in from the reading side inside its mask and rolls up to its value (fast steps that shrink as it
// lands), while on the stage disc a stopwatch's hand sweeps once and stops with it. The label slides in under an ink hairline.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, S = ground.stage;
  const x0 = SAFE.left, x1 = SAFE.right;
  const label = kit.fit(S0.label, { size: T.size.label, weight: 700, maxW: x1 - x0, minScale: 0.85, where: 'the count label' });
  const text = (v) => (S0.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S0.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S0.value), size, 900, 1) > x1 - x0 && size > 120) size -= 8;
  const block = size * 1.1 + 40 + label.height, top = Math.min(kit.place(block, 680), T.textBottom - block);
  const yNum = top + size * 0.55, yRule = top + size * 1.1 + 10, yLabel = yRule + 30 + label.lead / 2;
  const travel = (x1 - x0) + 80, dir = kit.rtl ? 1 : -1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, at + 0.15, at + 1.15), out = span(t, d - T.dur.out - 0.08, d - 0.08);
      M.stage(ctx, S.x, S.y, S.r, P); M.watch(ctx, S.x, S.y, S.r, P, ease.outCubic(p));
      const pin = span(t, at, at + T.dur.row);
      if (pin > 0 && out < 1) {
        ctx.save(); ctx.beginPath(); ctx.rect(x0 - 70, yNum - size * 0.62, x1 - x0 + 140, size * 1.24); ctx.clip();
        ctx.translate((1 - M.snap(pin)) * travel * dir - M.accel(out) * travel * dir, 0);
        kit.number(ctx, text(countValue(0, S0.value, p)), { x: kit.rtl ? x1 : x0, y: yNum, size, color: P.ink, align: kit.rtl ? 'right' : 'left', settle: p });
        ctx.restore();
      }
      const rw = (x1 - x0) * M.glide(span(t, at + 0.25, at + 0.65)) * (1 - M.accel(out));
      ctx.fillStyle = P.ink; ctx.fillRect(kit.rtl ? x1 - rw : x0, yRule, rw, 4);
      M.slideText(ctx, kit, label, { x0, x1, y: yLabel, color: P.grey, P, rowIn: (r) => span(t, at + 0.35 + r * T.dur.stagger, at + 0.35 + r * T.dur.stagger + T.dur.row), rowOut: (r) => span(t, d - T.dur.out + r * 0.04 - 0.1, d + r * 0.04 - 0.1) });
    },
  };
}
