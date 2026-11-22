// A number on its own sheet: the figure is lettered big in black (uncovered from the reading side) while it counts up, then the
// coloured marker loops round it a little more than once, and a short black arrow points from the loop down to the label, lettered
// below. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, T.weight.count, 1) > full - 200 && size > 100) size -= 8;
  const nw = kit.numberWidth(text(S.value), size, T.weight.count, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 30, minScale: 0.8, where: 'the count label' });
  const ry = size * 0.62, rx = Math.min(full / 2, nw / 2 + 80);
  const top = kit.place(ry * 2 + 150 + label.height, 680), cy = top + ry, cx = W / 2, yLabel = cy + ry + 130 + label.lead / 2;
  const ring = M.loop(cx, cy, rx, ry, 51, 1.15, rtl);
  const ax = cx + (rtl ? -1 : 1) * rx * 0.25, arrow = M.hand([ax, cy + ry + 14], [ax + (rtl ? -20 : 20), yLabel - label.lead / 2 - 6], 52, 4);
  const tip = arrow[arrow.length - 1], head = [[tip[0] - 16, tip[1] - 20], tip, [tip[0] + 16, tip[1] - 18]];
  const sl = M.schedule(label, at + 1.75, T.write.lead);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, at, at + 1.1), po = span(t, at, at + 0.3);
      if (po > 0) {
        const str = text(countValue(0, S.value, p, ease.outCubic)), w = nw + 60, ww = w * po;
        ctx.save(); ctx.beginPath(); ctx.rect(rtl ? cx + w / 2 - ww : cx - w / 2, cy - size, ww, size * 2); ctx.clip(); ctx.globalCompositeOperation = 'multiply';
        kit.number(ctx, str, { x: cx, y: cy, size, weight: T.weight.count, color: P.ink, settle: p });
        ctx.restore();
      }
      M.marker(ctx, ring, span(t, at + 1.15, at + 1.6), P.pen, T.pen.line);
      M.marker(ctx, arrow, span(t, at + 1.55, at + 1.7), P.ink, T.pen.thin);
      M.marker(ctx, head, span(t, at + 1.7, at + 1.78), P.ink, T.pen.thin);
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: P.ink, each: (w, j, b, c) => M.letter(c, t, sl.at(j), w, b, label, P.ink, rtl) });
    },
  };
}
