// A number as a measurement. A sine runs across the whole screen, scrolling; its height grows with the reading while the readout above
// counts up in steps that shrink as it lands, so the figure and the curve are always the same value. Two dashed cursors ride the crests
// and lock when it lands; then the label lights under the curve. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rgba, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, g = ground.g;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > SAFE.right - SAFE.left - 40 && size > 90) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 40, minScale: 0.8, where: 'the count label' });
  const amp = 110, block = size * 1.1 + 60 + amp * 2 + 60 + label.height, top = kit.place(block, 700);
  const yNum = top + size * 0.55, yW = top + size * 1.1 + 60 + amp, yLabel = yW + amp + 60 + label.lead / 2;
  const sLabel = M.lightText(kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center' }, pal, T);
  const t0 = at + 0.15, t1 = at + 1.45, steps = 20, tL = t1 + 0.1, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = t < out0 ? 1 : Math.exp(-(t - out0) / 0.09);
      const raw = span(t, t0, t1), p = raw >= 1 ? 1 : Math.floor(M.E(raw) * steps) / steps, A = Math.max(4, amp * p);
      const ph = (t + clock) * 3.2 * (rtl ? 1 : -1), on = span(t, at, at + 0.35);
      const pts = M.curve(g.x0, g.x1, (x) => yW - Math.sin((x - g.x0) / 52 + ph) * A, 5);
      M.trace(ctx, pts, pal, { head: rtl ? 1 : on, alpha: fade * (rtl ? on : 1), spot: false });
      // cursors on the crests
      const cl = span(t, t0, t0 + 0.3) * fade;
      if (cl > 0) {
        ctx.save(); ctx.globalAlpha = cl; ctx.setLineDash([12, 10]); ctx.lineWidth = 2; ctx.strokeStyle = raw >= 1 ? pal.beam : rgba(pal.text, 0.5);
        for (const y of [yW - A, yW + A]) { ctx.beginPath(); ctx.moveTo(g.x0, y); ctx.lineTo(g.x1, y); ctx.stroke(); }
        ctx.restore();
      }
      if (t >= t0 && fade > 0.01) {
        const str = text(countValue(0, S.value, p, (x) => x)), heat = raw >= 1 ? M.cool(t - t1, 0.3, 0) : 0.3;
        ctx.save(); ctx.globalAlpha = fade; ctx.shadowColor = rgba(pal.beam, 0.9); ctx.shadowBlur = 30;
        kit.number(ctx, str, { x: W / 2, y: yNum, size, weight: 800, color: mix(pal.beam, pal.core, heat), settle: raw >= 1 ? 1 : 0 });
        ctx.restore();
      }
      sLabel.draw(ctx, () => (t >= tL ? M.cool(t - tL, T.dur.tau, 0.75) * fade : 0), () => M.cool(t - tL, T.dur.heat, 0));
    },
  };
}
