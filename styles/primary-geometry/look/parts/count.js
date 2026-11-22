// A number: a plate locks together; on it a giant numeral climbs to its value in four snapped steps while, on the far side, a disc
// fills by one accent quarter at each step, so the count is also a turning part of the machine. The label is typed by the rolling
// square under a rule. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, pad = T.plate.pad, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const inW = SAFE.right - SAFE.left - pad * 2, R = 110;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: inW, minScale: 0.88, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > inW - R * 2 - 30 && size > 110) size -= 8;
  const numH = size * 1.05, h = pad + numH + 30 + label.height + pad;
  const top = kit.place(h, 740), plate = { x: SAFE.left, y: top, w: SAFE.right - SAFE.left, h };
  const yNum = top + pad + numH / 2, yRule = top + pad + numH + 8, yLabel = yRule + 22 + label.lead / 2;
  const dx = rtl ? SAFE.left + pad + R : SAFE.right - pad - R;
  const t0 = at + T.dur.stage + 0.05, every = 0.32;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.stage(ctx, plate, span(t, at, at + T.dur.stage), span(t, d - T.dur.out, d), P.paper, () => {
        const st = t < t0 ? 0 : Math.min(4, M.steps(t, every, t0, T.dur.snap)), p = st / 4;
        // the dial: a ring, and accent quarters that turn in one by one
        ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(dx, yNum, R, 0, Math.PI * 2); ctx.stroke();
        const a0 = -M.Q, sweep = (rtl ? -1 : 1) * st * M.Q;
        if (st > 0) { ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(dx, yNum); ctx.arc(dx, yNum, R - 14, a0, a0 + sweep, rtl); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = P.ink; ctx.fillRect(dx - 2, yNum - R - 14, 4, 28);
        kit.number(ctx, text(countValue(0, S.value, p, (x) => x)), { x: rtl ? SAFE.right - pad : SAFE.left + pad, y: yNum, size, color: P.ink, align: rtl ? 'right' : 'left', settle: p });
        const rw = (SAFE.right - SAFE.left - pad * 2) * M.SNAP(span(t, t0, t0 + 0.4));
        ctx.fillStyle = P.ink; ctx.fillRect(rtl ? SAFE.right - pad - rw : SAFE.left + pad, yRule, rw, 3);
        M.typeset(ctx, kit, label, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: yLabel, t, t0: t0 + 0.3, pal: P, T, color: P.grey });
      });
    },
  };
}
