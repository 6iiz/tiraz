// A number: a carved medallion of dyed hide is pressed to the screen on its rod and turns slowly; the numeral is the dark shadow of a
// cut figure laid over its solid centre and climbs to its value; the label follows word by word below.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, dir = rtl ? 1 : -1;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const R = 250, med = M.medallion(R, P.hide, P, 51);
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > R * 1.15 && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW: SAFE.right - SAFE.left - 40, minScale: 0.85, where: 'the count label' });
  const cy = kit.place(2 * R + 70 + label.height, 720) + R, yLabel = cy + R + 60 + label.lead / 2, cx = W / 2;
  const out = (t) => span(t, d - T.dur.out, d);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = out(t);
      ctx.save();
      if (M.press(ctx, span(t, at, at + 0.4), cx, cy, dir) !== false && M.lift(ctx, o, cx, cy) !== false) {
        ctx.translate(0, M.bob(t, Math.max(at + 1.45, 0.4), 2));
        M.rod(ctx, cx + R * 0.5 * dir, cy + R * 0.82, 90 * dir, 260, P);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate((t - at) * 0.08); M.lay(ctx, med, 0, 0); ctx.restore();
        const p = span(t, at + 0.2, at + 1.45);
        if (p < 0.15) ctx.filter = `blur(${((0.15 - p) * 40).toFixed(1)}px)`;
        kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: cx, y: cy + size * 0.04, size, color: P.ink, align: 'center', settle: p });
      }
      ctx.restore();
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: P.ink,
        each: (w, i, box, c) => {
          const t0 = at + 0.55 + i * 0.07, mx = box.x + box.width / 2;
          if (M.press(c, span(t, t0, t0 + T.dur.press), mx, box.y, dir) === false) return false;
          if (M.lift(c, o, mx, box.y) === false) return false;
        } });
    },
  };
}
