// A number as the big callout of a chart: the figure counts to its true value, flush to the reading side, over a bar on a track.
// When the number is a share (suffix "%" and a value from 0 to 100) the bar stops at that share of the track, with quarter ticks,
// so it is a true chart. Otherwise the bar only keeps time with the count and fills the track: it shows no share.
// The label sits under the bar. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  if (typeof S.value !== 'number') throw new Error('the count spec\'s "value" must be a number');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const maxW = SAFE.right - SAFE.left;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 100) size -= 8;
  const share = /%|٪/.test(S.suffix ?? '') && S.value >= 0 && S.value <= 100 ? S.value / 100 : null;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.8, where: 'the count label' });
  const yNum = kit.place(size * 1.2 + 120 + label.height, 680) + size * 0.6, yBar = yNum + size * 0.62 + 56, yLabel = yBar + 60 + label.lead / 2;
  const tb = T.bar.track, x0 = SAFE.left, x1 = SAFE.right;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = 1 - M.D(span(t, d - T.dur.out, d)), p = span(t, at + 0.2, at + 1.6), e = M.D(p);
      ctx.save(); const a = M.E(span(t, at, at + T.dur.in)); ctx.globalAlpha = a * fade;
      kit.number(ctx, text(countValue(0, S.value, p, M.D)), { x: rtl ? x1 : x0, y: yNum, size, color: pal.text, align: rtl ? 'right' : 'left', settle: p });
      ctx.restore();
      const pt = M.D(span(t, at, at + 0.5)) * fade;
      if (pt > 0) {
        M.rule(ctx, x0, x1, yBar, pt, pal.track, tb, rtl);
        if (share !== null) [0.25, 0.5, 0.75].forEach((q) => { const x = rtl ? x1 - (x1 - x0) * q : x0 + (x1 - x0) * q; ctx.fillStyle = pal.axis; ctx.fillRect(x - 1, yBar + tb / 2 + 4, 2, 14 * pt); });
        const fill = (share ?? 1) * e;
        if (fill > 0) {
          M.rule(ctx, x0, x1, yBar, fill * fade, pal.accent, tb, rtl);
          const ex = rtl ? x1 - (x1 - x0) * fill * fade : x0 + (x1 - x0) * fill * fade;
          ctx.fillStyle = pal.text; ctx.fillRect(ex - 2, yBar - tb, 4, tb * 2);       // the cursor at the bar's end
        }
      }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.muted,
        each: (w, i, box, c) => {
          const t0 = at + 0.4 + i * T.dur.stagger;
          if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, label.size, rtl) === false) return false;
          if (M.leave(c, span(t, d - T.dur.out, d), box, label.size) === false) return false;
        } });
    },
  };
}
