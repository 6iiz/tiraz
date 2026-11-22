// A number, printed big: an accent disc is laid first, the numeral counts up on it in the ink that reads there, with its accent ghost
// slightly off register; a small halftone disc overlaps the edge of the big one. The label sits under it on a rough accent rule.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, feed, blob, disc, overprint, E } = await import(look.base + 'motion.js');
  const P = ground.P, reg = ground.reg, maxW = SAFE.right - SAFE.left;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 40 && size > 110) size -= 8;
  const wNum = kit.numberWidth(text(S.value), size, 900, 1), r = Math.min(470, Math.max(size * 0.68, wNum / 2 + 60));
  const block = 2 * r + 70 + label.height, top = kit.place(block, 700);
  const cx = W / 2, cy = top + r, yLabel = top + 2 * r + 70 + label.lead / 2;
  const small = { x: cx + (kit.rtl ? -1 : 1) * r * 0.86, y: cy + r * 0.62, r: r * 0.42 };
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), p = span(t, at + 0.25, at + 1.5);
      ctx.save();
      if (feed(ctx, span(t, at, at + 0.45), out, 0, cy - r - 20, W, 2 * r + 40) !== false) {
        overprint(ctx, reg, () => disc(ctx, cx, cy, r, P.accent));
        disc(ctx, small.x, small.y, small.r, ground.screen(ctx, 'ink'));
        ground.wear(ctx);
        const str = text(countValue(0, S.value, p));
        ctx.save(); ctx.globalCompositeOperation = 'multiply';
        kit.number(ctx, str, { x: cx + reg.x * 1.6, y: cy + reg.y * 1.6, size, color: P.accent, settle: p, decor: true });
        ctx.restore();
        kit.number(ctx, str, { x: cx, y: cy, size, color: P.on, settle: p });
      }
      ctx.restore();
      const rw = label.width + 40, pr = E(span(t, at + 0.6, at + 1.0));
      ctx.save();
      if (feed(ctx, pr, out, cx - rw / 2 - 10, yLabel + label.size * 0.45, rw + 20, 30) !== false)
        overprint(ctx, reg, () => blob(ctx, cx - rw / 2, yLabel + label.size * 0.55, rw, 14, 77, P.accent));
      ctx.restore();
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.ink, key: P.ink,
        each: (w, i, box, c) => {
          const t0 = at + 0.5 + i * T.dur.step;
          if (arrive(c, span(t, t0, t0 + T.dur.in), box, label.size) === false) return false;
          if (leave(c, out, box, label.size) === false) return false;
        } });
    },
  };
}
