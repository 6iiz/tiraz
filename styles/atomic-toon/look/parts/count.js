// A number as a numbered medallion, the way an appliance manual marks a step: a big round of the accent printed off register inside
// its broken ink line, with a ring of paper dots that turns a notch on every other drawing. The number counts up on twos inside it.
// The label pops on below, and a curved arrow is drawn from it up to the medallion. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, room: 1 });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 700 && size > 100) size -= 8;
  const numW = kit.numberWidth(text(S.value), size, 900, 1), R = Math.max(200, Math.min(430, numW / 2 + 80));
  const cy = 280 + R, label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 160, minScale: 0.88, where: 'the count label' });
  const yLabel = Math.min(cy + R + 90, 1248 - label.height) + label.lead / 2;
  const disc = M.circle(W / 2, cy, R), ring = Array.from({ length: 24 }, (_, i) => i);
  const land = at + 1.1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save();
      if (M.grow(ctx, M.pop(t, at, 0.4), W / 2, cy) !== false) {
        M.cel(ctx, disc, { fill: P.accent, line: P.ink, width: 6, id: 70, t, gaps: 0.14 });
        const turn = M.twos(t) * 0.5 * (Math.PI / 24) * (rtl ? -1 : 1);
        for (const i of ring) { const a = (i / 24) * Math.PI * 2 + turn; M.cel(ctx, M.circle(W / 2 + Math.cos(a) * (R - 26), cy + Math.sin(a) * (R - 26), 7), { fill: P.paper, id: 71, t }); }
        const p = span(t, at + 0.2, land), stepped = Math.floor(p * 0.9 * 12 + 1e-6) / (0.9 * 12);
        if (p > 0) {
          ctx.save(); M.grow(ctx, t >= land && t < land + 0.25 ? 1.08 : 1, W / 2, cy);          // a held bump on the drawings where it lands
          kit.number(ctx, text(countValue(0, S.value, p >= 1 ? 1 : stepped, (x) => x)), { x: W / 2, y: cy, size, weight: 900, color: P.onAccent, align: 'center', settle: p });
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.save();
      if (M.grow(ctx, M.pop(t, at + 0.5, T.dur.pop), W / 2, yLabel) !== false)
        kit.drawText(ctx, label, { x0: X0 + 80, x1: X1 - 80, y: yLabel, align: 'center', color: P.ink });
      ctx.restore();
      // the arrow from beside the label up to the medallion's rim
      const sx = rtl ? X0 + 40 : X1 - 40, sy = yLabel + 10, ex = W / 2 + (rtl ? -1 : 1) * R * 0.78, ey = cy + R * 0.7;
      M.arrow(ctx, sx, sy, sx, ey + 40, ex + (rtl ? -18 : 18), ey + 14, span(t, at + 0.7, at + 1.0), P.ink, t);
    },
  };
}
