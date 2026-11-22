// A number read off the tape: a large numeral comes into focus over the dark end of the hall and rolls up to its value like a tape
// counter (quick steps that slow as it lands), a short accent rule locks under it, and the label focuses in below.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const label = kit.fit(S0.label, { size: T.size.label, weight: 700, maxW: x1 - x0, minScale: 0.85, where: 'the count label' });
  const text = (v) => (S0.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S0.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S0.value), size, 800, 1) > x1 - x0 && size > 120) size -= 8;
  const block = size * 1.1 + 40 + label.height, top = kit.place(block, T.vy - 20);
  const yNum = top + size * 0.55, yRule = top + size * 1.1 + 6, yLabel = yRule + 34 + label.lead / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = ground.time(t), out = span(t, d - T.dur.out, d), p = span(t, at + 0.1, at + 1.2), pin = span(t, at, at + T.dur.focus);
      M.shade(ctx, P, x0, x1, top, top + block);
      if (pin > 0 && out < 1) {
        const hunt = pin < 0.55 ? 10 * (1 - pin / 0.55) ** 1.4 : 2.2 * Math.sin(Math.PI * (pin - 0.55) / 0.45), blur = hunt + M.accel(out) * 6;
        ctx.save(); ctx.globalAlpha = Math.min(1, pin * 3) * (1 - M.accel(out)); if (blur > 0.25) ctx.filter = `blur(${blur.toFixed(2)}px)`;
        ctx.translate(M.accel(out) * 120, 0);
        kit.number(ctx, text(countValue(0, S0.value, p)), { x: W / 2, y: yNum, size, weight: 800, color: P.text, align: 'center', settle: p });
        ctx.restore();
      }
      const rw = 220 * M.soft(span(t, at + 1.1, at + 1.4)) * (1 - M.accel(out));
      ctx.fillStyle = P.acc; ctx.fillRect(W / 2 - rw / 2, yRule, rw, 7);
      M.focusText(ctx, kit, label, { x0, x1, y: yLabel, color: P.grey, P, keyed: false, when: (r) => at + 0.3 + r * T.dur.row, out, t, time });
      ground.over(ctx, t);
    },
  };
}
