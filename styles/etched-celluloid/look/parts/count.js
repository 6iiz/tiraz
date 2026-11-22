// A number scratched into the emulsion: a ring is cut round the place where it will stand (with a second ring of dye inside it), the figure
// climbs to its value one drawing at a time (twelve values a second, the steps shrinking at the end), boiling, and stays; then the label is
// cut under it from the reading side. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > 700 && size > 90) size -= 6;
  const numW = kit.numberWidth(text(S.value), size, 800, 1);
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minScale: 0.8, where: 'the count label' });
  const ry = size * 0.78, rx = Math.min(460, Math.max(numW / 2 + 90, ry + 40)), h = ry * 2 + 70 + label.height, top = kit.place(h, 700);
  const cx = W / 2, cy = top + ry, yLabel = top + ry * 2 + 70 + label.lead / 2;
  const ring = M.arc(cx, cy, rx, ry, -Math.PI * 0.5, Math.PI * 1.55, 14), inner = M.arc(cx, cy, rx - 22, ry - 18, Math.PI * 0.5, Math.PI * 2.45, 16);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const n = ground.n(t), w = ground.weave(t), tl = t - at, td = Math.floor(tl * M.DRAW + 1e-6) / M.DRAW;
      ctx.save(); ctx.translate(w.x, w.y);
      M.needle(ctx, ring, { w: 4, n, seed: 21, color: P.cream, p: span(tl, 0, 0.45), passes: 3, tremble: 2.2 });
      M.needle(ctx, inner, { w: 9, n, seed: 22, color: P.dye, p: span(tl, 0.25, 0.7), alpha: 0.55, tremble: 2.6 });
      if (tl >= 0.3) {
        const p = span(td, 0.3, 1.4), b = M.boil(n, 77, 1.5);
        ctx.save(); ctx.translate(b.x, b.y); ctx.shadowColor = rgba(P.cream, 0.45); ctx.shadowBlur = 26;
        kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: cx, y: cy + size * 0.04, size, weight: 800, color: P.cream, settle: p });
        ctx.restore();
        if (p >= 1) {                                                     // skips through the landed figure
          const r = M.boil(n, 78, 1); ctx.fillStyle = P.emulsion;
          ctx.fillRect(cx - numW * 0.4 + r.x * 20, cy - size * 0.1 + r.y * 30, numW * 0.35, 2); ctx.fillRect(cx - numW * 0.1 - r.y * 20, cy + size * 0.18 + r.x * 20, numW * 0.4, 2);
        }
      }
      M.cutText(kit, ctx, label, { x0, x1, y: yLabel, align: 'center', t: tl, t0: 1.0, step: 0.08, dur: 0.16, n, seed: 25, P });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
