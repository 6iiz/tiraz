// A number in a 1-bit window. The plate comes up through the dither; the figure climbs to its value in steps of the 15 fps grid
// while a progress bar under it fills with half-screened dots, block by block; when it lands the bar turns solid and the label is
// set word by word behind the block cursor. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x = SAFE.left, w = SAFE.right - SAFE.left, pad = 44, bar = 48;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > w - pad * 2 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: w - pad * 2, minScale: 0.8, where: 'the count label' });
  const hNum = size * 1.05, barH = 40, h = M.snap(bar + pad + hNum + 30 + barH + 36 + label.height + pad - 10);
  const y = M.snap(Math.min(kit.place(h, 700), T.floor - h));
  const yNum = y + bar + pad + hNum / 2, yBar = M.snap(yNum + hNum / 2 + 30), yLabel = yBar + barH + 36 + label.lead / 2;
  const bx = M.snap(x + pad), bw = M.snap(w - pad * 2), t1 = at + T.dur.open + 1.0;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = M.step(t), p = span(ts, at + T.dur.open, t1);
      M.dissolve(ctx, span(ts, at, at + T.dur.open), [x, y, w + 16, h + 16], (c) => M.plate(c, P, x, y, w, h, { bar }));
      if (ts < at + T.dur.open) return;
      kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: W / 2, y: yNum, size, color: P.paper, settle: p });
      ctx.fillStyle = P.paper; ctx.fillRect(bx, yBar, bw, barH); ctx.fillStyle = P.ink; ctx.fillRect(bx + M.DOT, yBar + M.DOT, bw - 2 * M.DOT, barH - 2 * M.DOT);
      const blocks = 12, n = Math.round(ease.outCubic(p) * blocks), cw = (bw - 4 * M.DOT) / blocks;
      const fx = (k) => (kit.rtl ? bx + bw - 2 * M.DOT - (k + 1) * cw : bx + 2 * M.DOT + k * cw);
      for (let k = 0; k < n; k++) { if (p >= 1) { ctx.fillStyle = P.accent; ctx.fillRect(M.snap(fx(k)), yBar + 2 * M.DOT, M.snap(cw - M.DOT), barH - 4 * M.DOT); }
        else M.screen(ctx, fx(k), yBar + 2 * M.DOT, cw - M.DOT, barH - 4 * M.DOT, P.paper, 32); }
      kit.drawText(ctx, label, { x0: x + pad, x1: x + w - pad, y: yLabel, align: 'center', color: P.paper, key: P.paper,
        each: M.typed(ts, t1 + 0.1, T.dur.word, P, label.size, true, P.onAccent) });
    },
  };
}
