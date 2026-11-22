// A number as a computed readout. A plate opens; the figure rolls through noise and settles digit by digit from the left, in the words'
// colour; the moment the last digit settles, brackets lock onto it and it turns to the hologram's hue. Under it the label resolves.
// Below, a wireframe column is built ring by ring on the pad as the value climbs. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, sub = T.subject;
  const str = (S.prefix ?? '') + kit.fmt(S.value, spec.decimals ?? 0) + (S.suffix ?? '');
  const room = SAFE.right - SAFE.left - 120;
  let size = T.size.count; while (kit.numberWidth(str, size, T.weight.count, 1) > room && size > 90) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 80, minScale: 0.8, where: 'the count label' });
  const ph1 = size * 1.25, ph2 = label.height + 60, gap = 26, top = kit.place(ph1 + gap + ph2, 590);
  const yNum = top + ph1 / 2, top2 = top + ph1 + gap, yLabel = top2 + 30 + label.lead / 2;
  const nw = kit.numberWidth(str, size, T.weight.count, 1), nb = { x0: W / 2 - nw / 2, x1: W / 2 + nw / 2, y0: yNum - size * 0.42, y1: yNum + size * 0.42 };
  const r0 = at + 0.25, r1 = at + 1.35, lockT = r1;
  const scanAt = (k) => lockT + 0.05 + k * T.dur.step;
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), alive = 1 - M.I(out);
      const p = span(t, r0, r1), n = 1 + Math.round(7 * M.E(p));
      M.wire(ctx, M.meshes.rings(n, 0.9, 0.35 * (n - 1) + 0.01), { cx: sub.x, cy: sub.y + sub.s * 1.1 - 0.35 * (n - 1) * sub.s * 0.5, s: sub.s, a: (t + clock) * 0.4, b: 0.42, pal, alpha: alive * Math.min(1, span(t, at, at + 0.3) * 2), hot: t >= lockT ? Math.max(0, 1 - (t - lockT) / 0.5) : 0 });
      const k1 = M.plate(ctx, SAFE.left + 20, top, SAFE.right - SAFE.left - 40, ph1, pal, span(t, at, at + T.dur.open), out);
      if (k1 > 0.6 && t >= r0) {
        const s = M.rolling(str, p, Math.floor((t + clock) * 24));
        ctx.save(); ctx.globalAlpha = (k1 - 0.6) / 0.4;
        kit.number(ctx, s, { x: W / 2, y: yNum, size, weight: T.weight.count, color: t >= lockT ? pal.lock : pal.white, settle: p });
        ctx.restore();
      }
      M.brackets(ctx, nb, span(t, lockT - T.dur.lock, lockT), pal, out);
      const k2 = M.plate(ctx, SAFE.left + 60, top2, SAFE.right - SAFE.left - 120, ph2, pal, span(t, lockT - 0.1, lockT - 0.1 + T.dur.open), out);
      if (k2 > 0) {
        ctx.save(); ctx.beginPath(); const hh = ph2 * k2; ctx.rect(0, top2 + (ph2 - hh) / 2, W, hh); ctx.clip();
        kit.drawText(ctx, label, { x0: SAFE.left + 40, x1: SAFE.right - 40, y: yLabel, align: 'center', color: pal.white,
          each: (w, i, box, c) => M.resolve(c, span(t, scanAt(i), scanAt(i) + T.dur.scan), box, label.size, pal, rtl) });
        ctx.restore();
      }
    },
  };
}
