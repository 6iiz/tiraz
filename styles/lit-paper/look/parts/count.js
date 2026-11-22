// A number cut through a card: the card slides up into its groove, the numeral is a large cut that the lamp fills as it climbs to its
// value (glowing through accent tissue), and the label's words light below it, one after another.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, rgba, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = T.textW, text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 40 && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW, minScale: 0.85, where: 'the count label' });
  const block = size * 1.1 + 30 + label.height, top = kit.place(block + 60, 720) + 30;
  const yNum = top + size * 0.55, yLabel = top + size * 1.1 + 30 + label.lead / 2;
  const cw = Math.min(W - 120, Math.max(600, Math.max(label.width, kit.numberWidth(text(S.value), size, 900, 1)) + 160)), C = M.card(cw, block + 100, P, 17);
  const cx0 = W / 2 - cw / 2, cy0 = top - 50, x0 = W / 2 - maxW / 2, x1 = W / 2 + maxW / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const g = M.groove(span(t, at, at + 0.42), span(t, d - T.dur.out, d));
      if (g) {
        ctx.save(); ctx.translate(ground.drift(t, 0.55), g.dy);
        M.layCard(ctx, C, cx0, cy0, g.lift);
        const p = span(t, at + 0.25, at + 1.5), q = M.O(span(t, at + 0.2, at + 0.45));
        if (q > 0) {
          ctx.save(); ctx.shadowColor = rgba(P.key, 0.6 * q); ctx.shadowBlur = 30 * q;
          kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: W / 2, y: yNum, size, color: q >= 1 ? P.key : mix(P.dim, P.key, q), align: 'center', settle: p });
          ctx.restore();
        }
        kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: P.glow,
          each: (w, i, box, c) => { const s0 = at + 0.6 + i * 0.08; return M.light(c, span(t, s0, s0 + T.dur.light), P.glow, P); } });
        ctx.restore();
      }
      ground.drawFront(ctx, t);
    },
  };
}
