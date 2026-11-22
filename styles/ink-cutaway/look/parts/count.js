// A number: the section window opens in step with the count, and a dimension line above the drawing measures the opening as it
// grows. The figure itself is set large in ink under the drawing, the label under it on a hairline, and when the count lands the
// accent path runs through the open section. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const g = { cx: W / 2 - 40, cy: 560, L: T.spec.L, R: T.spec.R };
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.88, minPx: 44, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 110) size -= 8;
  const yNum = g.cy + g.R + 70 + size * 0.5, yRule = yNum + size * 0.56, yLabel = yRule + 26 + label.lead / 2;
  const runs = M.keyRuns(M.boxes(kit, label, SAFE.left, SAFE.right, yLabel));
  const run = [at + 0.1, at + 1.5], out0 = d - T.dur.out;
  const wa = g.cx - g.L / 2 + g.L * 0.16, wb = g.cx + g.L / 2 - g.L * 0.12;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, run[0], run[1]), q = span(t, out0, d), cut = M.soft(p);
      ctx.save(); ctx.globalAlpha = 1 - q;
      M.specimen(ctx, pal, g, { draw: span(t, at - 0.2, at + 0.3), cut, flow: t, flowP: span(t, run[1] - 0.2, run[1] + 0.5), plug: 0, rtl });
      const xa = rtl ? wb - (wb - wa) * cut : wa, xb = rtl ? wb : wa + (wb - wa) * cut;
      if (cut > 0.02) M.dimension(ctx, pal, xa, xb, g.cy - g.R - 60, g.cy - g.R - 8, g.cy - g.R - 8, Math.min(1, cut * 1.2));
      const rw = maxW * M.soft(span(t, at + 0.2, at + 0.8));
      ctx.fillStyle = pal.ink; ctx.fillRect(rtl ? SAFE.right - rw : SAFE.left, yRule, rw, 1.5);
      ctx.fillStyle = pal.path; ctx.fillRect(rtl ? SAFE.right - 70 : SAFE.left, yRule - 2.5, 70 * span(t, run[1] - 0.1, run[1] + 0.1), 6);
      runs.forEach((r) => { const k = M.soft(span(t, at + 0.75, at + 1.0)), w = (r.x1 - r.x0) * k; ctx.fillRect(rtl ? r.x1 - w : r.x0, r.y + label.size * 0.7 - 1.5, w, 3); });
      ctx.restore();
      const v = countValue(0, S.value, p, (x) => M.soft(x));
      if (t >= at) {
        ctx.save(); const k = M.soft(span(t, at, at + 0.25)), w = W * k;
        ctx.beginPath(); if (rtl) ctx.rect(W - w, yNum - size, w, size * 2); else ctx.rect(0, yNum - size, w, size * 2); ctx.clip(); ctx.globalAlpha = 1 - q;
        kit.number(ctx, text(v), { x: rtl ? SAFE.right : SAFE.left, y: yNum, size, color: pal.ink, align: rtl ? 'right' : 'left', settle: p });
        ctx.restore();
      }
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: pal.grey, key: pal.key,
        each: (w, i, box, c) => { if (M.inked(c, t, at + 0.45 + i * 0.05, T.dur.word, out0, d, box, label.size, rtl) === false) return false; } });
    },
  };
}
