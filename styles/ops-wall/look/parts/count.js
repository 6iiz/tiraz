// A number on the briefing wall: a dimension line is drawn first in the measuring marker (end ticks, arrow heads), the figure counts up
// above it in graphite in shrinking steps, and when it lands the accent marker boxes it in, the decision. The label is on a card that
// lands under it with a magnet. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > maxW - 140 && size > 100) size -= 8;
  const nw = kit.numberWidth(text(S.value), size, 800, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: maxW - 120, minScale: 0.8, where: 'the count label' });
  const cardH = label.height + 44, cardW = Math.min(maxW - 20, label.width + 110);
  const top = kit.place(size * 1.05 + 80 + 70 + cardH, 680), yNum = top + size * 0.55, yDim = top + size * 1.05 + 40, yCard = yDim + 70;
  const a = [W / 2 - nw / 2 - 30, yDim], b = [W / 2 + nw / 2 + 30, yDim];
  const dim = M.line(a, b, 5, 2), hA = M.head(b, a, 22), hB = M.head(a, b, 22);
  const tA = [[a[0], yDim - 26], [a[0], yDim + 26]], tB = [[b[0], yDim - 26], [b[0], yDim + 26]];
  const box = M.line([a[0] - 6, top + 10], [b[0] + 6, top + 4], 9, 4).concat(M.line([b[0] + 6, top + 4], [b[0] + 2, yDim - 40], 10, 3))
    .concat(M.line([b[0] + 2, yDim - 40], [a[0] - 2, yDim - 36], 11, 4)).concat(M.line([a[0] - 2, yDim - 36], [a[0] - 10, top + 30], 12, 3));
  const cx = W / 2 - cardW / 2, tLand = at + 1.35;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - 0.4, d), keep = 1 - ease.inQuad(q);
      ctx.save(); ctx.globalAlpha = keep;
      const pd = span(t, at, at + 0.35);
      M.stroke(ctx, tA, pd * 3, 5, P.measure); M.stroke(ctx, tB, pd * 3, 5, P.measure);
      M.stroke(ctx, dim, pd, 5, P.measure); M.stroke(ctx, hA, span(t, at + 0.3, at + 0.4), 5, P.measure); M.stroke(ctx, hB, span(t, at + 0.3, at + 0.4), 5, P.measure);
      const p = span(t, at + 0.15, tLand), sp = p >= 1 ? 1 : Math.floor(ease.outCubic(p) * 16) / 16;
      if (p > 0) kit.number(ctx, text(countValue(0, S.value, sp, (x) => x)), { x: W / 2, y: yNum, size, weight: 800, color: P.ink, settle: p });
      M.stroke(ctx, box, span(t, tLand, tLand + 0.5), 7, P.accent);
      ctx.restore();
      M.card(ctx, cx, yCard, cardW, cardH, P, span(t, at + 0.4, at + 0.8), q, rtl ? -0.01 : 0.01, () => {
        kit.drawText(ctx, label, { x0: cx + 55, x1: cx + cardW - 55, y: yCard + 22 + label.lead / 2, align: 'start', color: P.ink });
        M.magnet(ctx, rtl ? cx + cardW - 24 : cx + 24, yCard + 10, 15, P.ink, span(t, at + 0.7, at + 0.9));
      });
    },
  };
}
