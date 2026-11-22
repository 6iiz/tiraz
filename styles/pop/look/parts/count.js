// A number in an explosion: a big accent starburst pops in with ink action lines flying out round it, the numeral counts up inside
// it in the ink that reads on the accent, and when it lands the burst punches once more. The label sits in a tilted caption panel
// below. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, zoom, panel, burstPath, burst, action, E } = await import(look.base + 'motion.js');
  const P = ground.P, padX = 44, padY = 26;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 2 * padX, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > SAFE.right - SAFE.left - 100 && size > 110) size -= 8;
  const wNum = kit.numberWidth(text(S.value), size, 900, 1), a = Math.max(wNum / 2 + 40, size * 0.55), b = size * 0.5, spike = size * 0.5;
  const lH = label.height + 2 * padY, block = 2 * (b + spike) + 70 + lH, top = kit.place(block, 700);
  const cx = W / 2, cy = top + b + spike, lTop = cy + b + spike + 70, lW = label.width + 2 * padX, lX = cx - lW / 2;
  const path = burstPath(cx, cy, a, b, spike, 16, 0.1), land = at + 1.45, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d), k = span(t, land, land + 0.32), punch = 1 + 0.09 * Math.sin(k * Math.PI);
      action(ctx, cx, cy, a + spike + 30, a + spike + 130, 22, P, E(span(t, at + 0.1, at + 0.5)) * (1 - q));
      ctx.save();
      if (zoom(ctx, span(t, at, at + T.dur.panel), q, cx, cy, 0) !== false) {
        ctx.translate(cx, cy); ctx.scale(punch, punch); ctx.translate(-cx, -cy);
        burst(ctx, path, P.accent, P, T);
        const p = span(t, at + 0.25, land);
        kit.number(ctx, text(countValue(0, S.value, p)), { x: cx, y: cy + size * 0.04, size, color: P.on, settle: p });
      }
      ctx.restore();
      ctx.save();
      if (zoom(ctx, span(t, at + 0.5, at + 0.5 + T.dur.panel), q, cx, lTop + lH / 2, 0.03) !== false) {
        panel(ctx, lX, lTop, lW, lH, P.paper, P, T);
        kit.drawText(ctx, label, { x0: lX, x1: lX + lW, y: lTop + padY + label.lead / 2, color: P.ink, key: P.ink,
          each: (w, i, bx, c) => { const t0 = at + 0.65 + i * T.dur.step; if (arrive(c, span(t, t0, t0 + T.dur.in), bx, label.size) === false) return false; } });
      }
      ctx.restore();
    },
  };
}
