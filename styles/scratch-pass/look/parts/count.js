// A number engraved on a carved slip: the slip is cut out of the ink, the figure (ink, crossed by fine paper cuts like an engraving) climbs
// to its value and lands, a red knife stroke is cut under it, and the label slides in below. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, pad = T.pad;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const maxW = (SAFE.right - SAFE.left) + 48 - 2 * pad.x;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 90) size -= 6;
  const numW = kit.numberWidth(text(S.value), size, 900, 1);
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.8, where: 'the count label' });
  const inner = Math.max(numW, label.width, 360), sw = inner + 2 * pad.x;
  const sx1 = rtl ? SAFE.right + 24 : SAFE.left - 24 + sw, sx0 = sx1 - sw, tx0 = sx0 + pad.x, tx1 = sx1 - pad.x;
  const numH = size * 1.15, sh = pad.y * 2 + numH + 40 + label.height, top = kit.place(sh, 700);
  const yNum = top + pad.y + numH / 2, yKnife = yNum + size * 0.52, yLabel = top + pad.y + numH + 40 + label.lead / 2;
  const nx = rtl ? tx1 : tx0;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tl = t - at;
      M.carve(ctx, sx0, top, sx1, top + sh, span(tl, 0, T.dur.carve), P, { pitch: T.pitch, rtl });
      if (tl >= 0.3) {
        const p = span(tl, 0.3, 1.35);
        ctx.save(); ctx.globalAlpha = Math.min(1, (tl - 0.3) * 6);
        const w = kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: nx, y: yNum, size, weight: 900, color: P.ink, align: rtl ? 'right' : 'left', settle: p });
        ctx.fillStyle = P.paper;                                          // engraving: fine paper cuts through the figure
        const x0 = rtl ? nx - w : nx;
        for (let y = yNum - size * 0.5, k = 0; y < yNum + size * 0.5; y += 9, k++) ctx.fillRect(x0 - 4, y, w + 8, 1.2 + (k % 4 === 0 ? 0.8 : 0));
        ctx.restore();
        M.knife(ctx, x0 - 8, x0 + w + 8, yKnife, 14, P.red, span(tl, 1.35, 1.65), rtl);
      }
      kit.drawText(ctx, label, { x0: tx0, x1: tx1, y: yLabel, align: 'start', color: P.ink,
        each: (w, i, box, c) => M.arrive(c, span(tl, 0.55 + i * T.dur.step, 0.55 + i * T.dur.step + T.dur.in), label.size, rtl) });
    },
  };
}
