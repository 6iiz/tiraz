// A number as a measurement: a scale bar is ruled in pencil across the plate (a long line, then its ticks one after another), the
// figure is written above it and counts up while the coloured pencil hatches the bar from the reading side as far as the count has got,
// and the label is written under it. Rubbed out at the end. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, T.weight.count, 1) > full - 80 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 30, minScale: 0.8, where: 'the count label' });
  const top = kit.place(size * 1.1 + 150 + label.height, 680), yNum = top + size * 0.55, yBar = top + size * 1.1 + 30, yLabel = yBar + 100 + label.lead / 2;
  const bx0 = SAFE.left + 20, bx1 = SAFE.right - 20, bh = 28, ticks = 10;
  const rule = [M.wobble([0, 0], [1, 0], 81, 0.003), M.wobble([0, 0], [1, 0], 82, 0.003)];
  const fill = M.hatchStrokes(bx1 - bx0, bh, { angle: rtl ? -0.95 : -2.2, gap: 5, len: 24, seed: 83, rtl });
  const sl = M.schedule(label, at + 0.9, T.write.lead), nL = label.rows.reduce((n, r) => n + r.words.length, 0);
  const X = (f) => (rtl ? bx1 - f * (bx1 - bx0) : bx0 + f * (bx1 - bx0));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - T.dur.out, d), keep = 1 - Math.min(1, q * 1.3), p = span(t, at + 0.35, at + 1.45);
      ctx.save(); ctx.globalAlpha = keep;
      ctx.save(); ctx.beginPath(); const w = (bx1 - bx0) * ease.outCubic(p); ctx.rect(rtl ? bx1 - w : bx0, yBar - 4, w, bh + 8); ctx.clip();
      M.drawHatch(ctx, fill, bx0, yBar, 1, P.pen); ctx.restore();
      rule.forEach((u, j) => M.pencil(ctx, u.map(([x, y]) => [X(x), yBar + j * bh + y * 900]), span(t, at + j * 0.12, at + 0.4 + j * 0.12), P.graphite, 2.6));
      for (let k = 0; k <= ticks; k++) {
        const tk = span(t, at + 0.3 + k * 0.05, at + 0.38 + k * 0.05), x = X(k / ticks), long = k % 5 === 0;
        M.pencil(ctx, [[x, yBar - (long ? 18 : 8)], [x, yBar + bh]], tk, P.graphite, 2);
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = keep; ctx.translate(Math.sin(q * 40) * 3 * q, 0);
      const pw = span(t, at + 0.15, at + 0.4);
      if (pw > 0) {
        ctx.save(); const nw = kit.numberWidth(text(S.value), size, T.weight.count, 1) + 40, ww = nw * pw;
        ctx.beginPath(); ctx.rect(rtl ? W / 2 + nw / 2 - ww : W / 2 - nw / 2, yNum - size, ww, size * 2); ctx.clip();
        kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: W / 2, y: yNum, size, weight: T.weight.count, color: P.graphite, settle: p });
        ctx.restore();
      }
      ctx.restore();
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: P.soft,
        each: (w, k, box, c) => M.write(c, t, sl.at(k), box, label.size, rtl, q, k, nL) });
    },
  };
}
