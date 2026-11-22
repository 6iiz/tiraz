// A number in a wheel window. A clear roundel is leaded in, and the figure is painted on it in grisaille as it counts; round it, the
// wheel's coloured pieces are set one by one, clockwise from the top, keeping pace with the count, and each glows as the sun finds it.
// When the count lands the wheel is whole and fully lit. The label is painted on a pane below.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, clamp, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2;
  const R = 290, r0 = 196, N = 12;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > (r0 - 30) * 2 && size > 90) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 140, where: 'the count label' });
  const lw = Math.min(SAFE.right - SAFE.left, label.width + 120), lh = label.height + 70;
  const top = kit.place(R * 2 + 60 + lh, 700), cy = top + R, ly = top + R * 2 + 60;
  const lo = { x0: cx - label.width / 2, x1: cx + label.width / 2, y: ly + lh / 2 - label.height / 2 + label.lead / 2, align: 'center' };
  const tCount = at + 0.3, tLand = at + 1.8;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.q(t), out = span(t, d - T.dur.out, d), keep = 1 - Math.floor(out * 4) / 4;
      if (keep <= 0 || tq < at) return;
      const p = span(tq, tCount, tLand);
      ctx.save(); ctx.globalAlpha = keep;
      ctx.fillStyle = M.glass(pal, pal.tints[3], 0); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();   // the empty opening
      for (let i = 0; i < N; i++) {
        const placed = p * N - i; if (placed <= 0) continue;
        const a0 = -Math.PI / 2 + (i / N) * Math.PI * 2, a1 = a0 + Math.PI * 2 / N, L = clamp(placed / 2.5);
        ctx.fillStyle = M.glass(pal, pal.tints[i % 2 ? 0 : 1], L); ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.arc(cx, cy, r0, a1, a0, true); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = pal.lead; ctx.lineWidth = 7; ctx.stroke();
        M.jewel(ctx, cx + Math.cos((a0 + a1) / 2) * (R + r0) / 2, cy + Math.sin((a0 + a1) / 2) * (R + r0) / 2, 14, pal, pal.tints[i % 2 ? 4 : 2], L);
      }
      ctx.strokeStyle = pal.lead; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      const lit = clamp(0.2 + span(tq, tCount, tCount + 0.6) * 0.8);
      ctx.fillStyle = M.glass(pal, pal.clear, lit); ctx.beginPath(); ctx.arc(cx, cy, r0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pal.lead; ctx.lineWidth = 9; ctx.stroke();
      if (tq >= tCount) kit.number(ctx, text(countValue(0, S.value, p, M.O)), { x: cx, y: cy + size * 0.04, size, weight: 800, color: pal.paint, settle: p });
      if (tq >= at + 0.5) {
        const L = M.sun(tq, at + 0.6, T.dur.sun, rtl, 0.08);
        M.pane(ctx, cx - lw / 2, ly + (tq < at + 0.6 ? -10 : 0), lw, lh, pal, { lit: L(cx, ly), r: 8 });
        kit.drawText(ctx, label, { ...lo, color: pal.paint, key: pal.paint, each: (w, i, box, c) => M.painted(c, L(box.x + box.width / 2, box.y) * 1.25) });
      }
      ctx.restore();
    },
  };
}
