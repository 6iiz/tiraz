// A number in the notes: the fineliner draws a round badge, the grey marker lays its shadow on one side, the value is written big inside
// it (digit after digit from the left), a few short burst marks flick out round it, and the label is written underneath.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const str = (S.prefix ?? '') + kit.fmt(S.value, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(str, size, 800, 1) > 600 && size > 110) size -= 8;
  const nw = kit.numberWidth(str, size, 800, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, where: 'the count label' });
  const R = Math.max(size * 0.78, nw / 2 + 60), block = R * 2 + 90 + label.height, top = kit.place(block, 650);
  const cx = W / 2, cy = top + R, yLabel = top + 2 * R + 90 + label.lead / 2;
  const ring = M.circle(61, cx, cy, R, R * 0.96), shadow = M.circle(62, cx + 16, cy + 14, R, R * 0.96, 1);
  const bursts = [-2.5, -2.05, -1.1, -0.65].map((a, i) => M.line(70 + i, cx + Math.cos(a) * (R + 26), cy + Math.sin(a) * (R + 26), cx + Math.cos(a) * (R + 70), cy + Math.sin(a) * (R + 70), 1, 10));
  const t0 = at + 0.05, tN = t0 + 0.5, tB = tN + 0.6, tL = tB + 0.3;
  const sLabel = M.schedule(label, tL, tL + 0.7, T.write.word);
  const keys = M.layout(label, { x0, x1, y: yLabel }, rtl).filter((b) => b.key);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); ctx.translate(0, ground.drift(t));
      const pr = span(t, t0, t0 + 0.4);
      if (pr > 0) M.shade(ctx, span(t, t0 + 0.3, t0 + 0.55), (c) => { c.beginPath(); c.arc(cx + 16, cy + 14, R, 0, Math.PI * 2); c.arc(cx, cy, R, 0, Math.PI * 2, true); }, [cx - R, cy - R, cx + R + 20, cy + R + 20], P.greyDeep, rtl, 5);
      if (pr > 0) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = P.paper; ctx.fill(); ctx.restore(); }
      M.trace(ctx, ring, pr, T.pen.bold, P.ink);
      ctx.save();
      if (M.write(ctx, span(t, tN, tN + 0.55), { x: cx - nw / 2, y: cy, width: nw }, size, false) !== false)
        kit.number(ctx, str, { x: cx, y: cy + size * 0.04, size, weight: 800, color: P.ink, align: 'center', settle: 1 });
      ctx.restore();
      bursts.forEach((b, i) => M.trace(ctx, b, span(t, tB + i * 0.05, tB + 0.12 + i * 0.05), T.pen.bold, P.ink));
      keys.forEach((b, k) => M.highlight(ctx, span(t, tL + 0.75 + k * 0.1, tL + 0.95 + k * 0.1), b, label.size, P.hl, rtl));
      kit.drawText(ctx, label, { x0, x1, y: yLabel, color: P.ink, key: P.ink, each: M.writer(t, sLabel, label.size) });
      ctx.restore();
    },
  };
}
