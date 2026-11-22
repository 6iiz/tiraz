// A number as a double exposure: the numeral counts up while its ghost and its print, offset from each other, close into register
// on the last value; a lamp-coloured rule is drawn under it as it lands. The label arrives word by word the same way. Across the
// lower half a gull flies through the frame, a window with its own landscape inside, wings beating.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, dir = rtl ? 1 : -1;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.85, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > maxW - 40 && size > 110) size -= 8;
  const yNum = 520, yRule = yNum + size * 0.56, yLabel = yRule + 46 + label.lead / 2;
  const tex = M.landscape(W + 600, 900, P, 58);
  const tCount = at + 1.4, K = M.keys(kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start' }, P, T, dir);
  let curT = 0;
  const when = (k) => [span(curT, at + 0.5 + k * 0.07, at + 0.5 + k * 0.07 + T.dur.in), span(curT, d - T.dur.out, d)];
  return {
    duration: d,
    draw(ctx, t) {
      curT = t; ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d);
      // the gull crosses the lower half against the reading direction, its landscape sliding the other way inside it
      const fx = span(t, at - 0.3, d + 0.6), gx = rtl ? -260 + (W + 520) * fx : W + 260 - (W + 520) * fx;
      M.window(ctx, M.gull(0.45 + 0.5 * Math.sin(time * 4.4)), { x: gx, y: 1290 + Math.sin(time * 1.7) * 24, s: 1.05, flip: rtl ? 1 : -1 }, tex,
        -300 - T.drift.inside * 3 * t * dir, 840, P, 1);
      // the numeral: ghost and print close into one as the count lands
      const p = span(t, at, tCount), v = countValue(0, S.value, p, M.IO), str = text(v);
      const r = M.register(Math.min(1, span(t, at, tCount + 0.1)), out, T.ghost.shift * 1.6, T.ghost.alpha, dir);
      const nx = rtl ? SAFE.right : SAFE.left, align = rtl ? 'right' : 'left';
      if (r) {
        ctx.save(); ctx.translate(r.ghost.dx, r.ghost.dy); ctx.globalAlpha = r.ghost.a;
        kit.number(ctx, str, { x: nx, y: yNum, size, weight: 800, color: P.ink, align, settle: p, decor: true }); ctx.restore();
        ctx.save(); ctx.translate(r.print.dx, r.print.dy); ctx.globalAlpha = r.print.a;
        kit.number(ctx, str, { x: nx, y: yNum, size, weight: 800, color: P.ink, align, settle: p }); ctx.restore();
      }
      const rw = maxW * M.E(span(t, tCount - 0.2, tCount + 0.2)) * (1 - M.I(out));
      ctx.fillStyle = P.lamp; ctx.fillRect(rtl ? SAFE.right - rw : SAFE.left, yRule, rw, 6);
      M.twice(kit, ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start' }, { shift: T.ghost.shift * 0.7, ghostA: T.ghost.alpha, dir, when, color: P.grey, ghostColor: P.grey, style: K.style(t) });
      K.rule(ctx, span(t, at + 0.9, at + 1.2) * (1 - out));
    },
  };
}
