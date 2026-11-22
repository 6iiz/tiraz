// A number, measured like a part on a drawing: a dash-dot centre line runs through it, it counts to its value set flush to the reading
// side, a dimension line under it follows its width as it grows and a standing dimension on its far side gives its height. The number
// is the one accent thing; the label is plotted under it. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, rgba, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const ink = ground.ink, rtl = kit.rtl, maxW = SAFE.right - SAFE.left;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const room = maxW - 110;
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 120) size -= 8;
  const yNum = 620, xr = rtl ? SAFE.right : SAFE.left, cap = size * 0.36;
  const yDim = yNum + cap + 60, yLabel = yDim + 70 + label.lead / 2;
  const out0 = d - T.dur.out, countEnd = at + 1.5;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const gone = 1 - span(t, out0, d), p = span(t, at, countEnd);
      ctx.strokeStyle = rgba(ink.light, T.tone.guide * 1.4); ctx.lineWidth = 1.5;
      M.centre(ctx, rtl ? W - 40 : 40, yNum, rtl ? 40 : W - 40, yNum, span(t, at - 0.3, at + 0.4) * gone);
      const str = text(countValue(0, S.value, p)), w = kit.numberWidth(str, size, 900, p);
      const xl = rtl ? xr - w : xr, xe = rtl ? xr - w : xr + w;
      if (gone > 0) {
        ctx.save();
        if (gone < 1) { ctx.beginPath(); const r = (w + 20) * gone; ctx.rect(rtl ? xl - 10 : xr + w + 10 - r, yNum - size, r, size * 2); ctx.clip(); }
        kit.number(ctx, str, { x: xr, y: yNum, size, color: ink.key, align: rtl ? 'right' : 'left', settle: p });
        ctx.restore();
      }
      ctx.strokeStyle = rgba(ink.light, T.tone.line); ctx.lineWidth = 1.5;
      M.dim(ctx, xl, xl + w, yDim, span(t, at + 0.1, at + 0.6) * gone, yDim - (yNum + cap + 8));
      const xv = xe + (rtl ? -50 : 50);
      M.vdim(ctx, xv, yNum - cap, yNum + cap, span(t, countEnd - 0.2, countEnd + 0.3) * gone, 0);
      ctx.strokeStyle = rgba(ink.light, T.tone.guide); ctx.lineWidth = 1;
      M.seg(ctx, xe + (rtl ? 8 : -8), yNum - cap, xv + (rtl ? -12 : 12), yNum - cap, span(t, countEnd - 0.3, countEnd) * gone);
      M.seg(ctx, xe + (rtl ? 8 : -8), yNum + cap, xv + (rtl ? -12 : 12), yNum + cap, span(t, countEnd - 0.3, countEnd) * gone);
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: ink.light,
        each: (wd, i, box, c) => {
          const t0 = at + 0.5 + i * T.dur.step;
          if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, label.size, rtl, ink.accent) === false) return false;
          if (M.leave(c, span(t, out0, d), box, label.size, rtl) === false) return false;
        } });
    },
  };
}
