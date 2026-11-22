// A number counted off the footage. The play runs and freezes; the analyst measures the gap between the runner and the nearest
// defender with a marker line that has a tick at each end, drawn as the figure on the card counts up. The card holds the number,
// large, and the label under it. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, field = ground.field, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const pad = 40, bar = 12, x0 = SAFE.left + pad + (rtl ? 0 : bar), x1 = SAFE.right - pad - (rtl ? bar : 0), maxW = x1 - x0;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.92, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 100) size -= 8;
  const cy = 300, yNum = cy + 30 + size * 0.55, yLabel = yNum + size * 0.5 + 20 + label.lead / 2, cardH = yLabel + label.height - label.lead / 2 + 24 - cy;
  const keyRuns = M.runs(M.boxes(kit, label, { x0, x1, y: yLabel, align: 'start' }));
  const t0 = at - 1.0, fT = at + 0.2, tEnd = at + 1.25;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const live = Math.min(t, fT), tau = Math.max(0, live - t0), out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      const V = M.view(ctx, W, H, field, tau, { pan: -50 * M.IO(tau / 1.6), zoom: M.punch(t, fT) * (1 + 0.03 * M.IO(span(t, fT + 0.3, d))), fx: W / 2, fy: 1150, P });
      M.flash(ctx, W, H, t, fT, P);
      const pl = V.pl, a = V.to(pl.A2.x, pl.A2.z), b = V.to(pl.B4.x, pl.B4.z), m = M.E(span(t, at + 0.3, tEnd));
      ctx.save(); ctx.globalAlpha = keep;
      M.ring(ctx, a[0], a[1], V.k(pl.A2.z), span(t, fT + 0.05, fT + 0.3), P.pen, T.pen - 2);
      M.ring(ctx, b[0], b[1], V.k(pl.B4.z), span(t, fT + 0.12, fT + 0.37), P.light, T.pen - 3);
      if (m > 0) {
        const e = [a[0] + (b[0] - a[0]) * m, a[1] - 30 + (b[1] - a[1]) * m];
        M.pen(ctx, [[a[0], a[1] - 30], e], 1, P.pen, T.pen - 2, 5);
        const tick = (x, y) => M.pen(ctx, [[x, y - 18], [x, y + 18]], 1, P.pen, T.pen - 3, 6);
        tick(a[0], a[1] - 30); if (m >= 1) tick(b[0], b[1] - 30);
      }
      ctx.restore();
      M.chip(ctx, t < fT ? 'live' : 'freeze', live * T.fps + 3120, P, mono, rtl);
      const off = M.card(ctx, SAFE.left, cy, SAFE.right - SAFE.left, cardH, span(t, at - 0.05, at + T.dur.card), out, P, rtl, bar);
      ctx.save(); ctx.translate(off, 0);
      const p = span(t, at + 0.3, tEnd);
      kit.number(ctx, text(countValue(0, S.value, p, M.E)), { x: rtl ? x1 : x0, y: yNum, size, weight: 900, color: p >= 1 ? P.key : P.light, align: rtl ? 'right' : 'left', settle: p });
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.grey, key: P.key,
        each: (w, i, box, c) => { const s0 = at + 0.2 + i * T.dur.stagger; if (M.slide(c, span(t, s0, s0 + T.dur.in), out, label.size, rtl) === false) return false; } });
      keyRuns.forEach((r, j) => {
        const y = r.y + label.size * 0.62, xa = rtl ? r.x + r.width + 4 : r.x - 4, xb = rtl ? r.x - 4 : r.x + r.width + 4;
        M.pen(ctx, [[xa, y], [(xa + xb) / 2, y + 3], [xb, y + 6]], span(t, at + 0.6, at + 0.85), P.pen, 6, 21 + j);
      });
      ctx.restore();
    },
  };
}
