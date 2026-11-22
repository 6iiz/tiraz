// A number: a giant numeral set flush to the reading side climbs to its value in four eased steps (one module at a time), with one
// accent module beside it and a label under a 1 px rule. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, mix, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, steps, E } = await import(look.base + 'motion.js');
  const room = SAFE.right - SAFE.left - ground.colW - 24;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: SAFE.right - SAFE.left, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 120) size -= 8;
  const yNum = 600, yRule = yNum + size * 0.62, yLabel = yRule + 34 + label.lead / 2;
  const mod = ground.colW, mx = kit.rtl ? SAFE.left : SAFE.right - mod;
  const grey = mix(ground.paper, ground.ink, T.tone.grey + 0.2);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = steps(span(t, at, at + 1.6)), out = E(span(t, d - T.dur.out, d));
      ctx.save(); ctx.beginPath(); ctx.rect(0, yNum - size * 0.75, W, size * 1.5); ctx.clip(); ctx.translate(0, -out * size * 1.2);
      kit.number(ctx, text(countValue(0, S.value, p, (x) => x)), { x: kit.rtl ? SAFE.right : SAFE.left, y: yNum, size, color: ground.ink, align: kit.rtl ? 'right' : 'left', settle: p });
      ctx.restore();
      const pm = E(span(t, at + 1.35, at + 1.6)) * (1 - out);              // the accent module lands with the last step
      if (pm > 0) { ctx.fillStyle = brand.colors.accent; ctx.fillRect(mx, yNum - mod / 2, mod, mod * pm); }
      const pr = span(t, at + 0.2, at + 0.7) * (1 - out), rw = (SAFE.right - SAFE.left) * pr;
      ctx.fillStyle = ground.ink; ctx.fillRect(kit.rtl ? SAFE.right - rw : SAFE.left, yRule, rw, 2);
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: grey,
        each: (w, i, box, c) => {
          const t0 = at + 0.5 + i * T.dur.step;
          if (arrive(c, span(t, t0, t0 + T.dur.in), box, label.size) === false) return false;
          if (leave(c, span(t, d - T.dur.out, d), box, label.size) === false) return false;
        } });
    },
  };
}
