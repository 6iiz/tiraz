// A number: a big wheel stands half out of the frame on the side away from the reading side, driven by a deep-accent pinion. While
// the figure climbs, the pinion spins and the wheel turns at the true ratio; when the count lands, the wheel is dyed in the accent from
// the point where the pinion meets it. The figure is set large on the reading side, the label under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const m = 14, sx = rtl ? 1 : -1, yC = 600;
  const tr = M.train(m, { N: 40, x: rtl ? -60 : W + 60, y: yC }, [{ N: 10, phi: rtl ? 0.15 : Math.PI - 0.15 }]);
  const pg = tr.g[1], room = rtl ? SAFE.right - (pg.x + pg.G.ra) - 30 : (pg.x - pg.G.ra) - SAFE.left - 30;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minScale: 0.88, minPx: 44, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 110) size -= 8;
  const yNum = yC, yLabel = Math.max(yC + tr.g[0].G.ra + 70, yNum + size * 0.62 + 40) + label.lead / 2;
  const runs = M.keyRuns(M.boxes(kit, label, SAFE.left, SAFE.right, yLabel));
  const run = [at + 0.1, at + 1.5], out0 = d - T.dur.out;
  const big = tr.g[0], pin = tr.g[1], kk = big.G.r / (big.G.r + pin.G.r), contact = [big.x + (pin.x - big.x) * kk, big.y + (pin.y - big.y) * kk];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, run[0], run[1]), q = span(t, out0, d);
      // the pinion drives: idle turn plus the count's own turn; the wheel follows by the ratio
      const aPin = -sx * (t * 0.5 + M.smooth(p) * Math.PI * 4);
      // the wheel's angle from the pinion's: the train formula run backwards
      const A = tr.angles(pin.phi + (pin.phi + Math.PI + Math.PI / pin.N - aPin) * (pin.N / big.N));
      ctx.save(); ctx.globalAlpha = 1 - q;
      M.drawGear(ctx, big.G, big.x, big.y, A[0], pal.A, { neutral: pal.N, dye: { x: contact[0], y: contact[1], r: 700 * M.smooth(span(t, run[1] - 0.15, run[1] + 0.7)) }, depth: 14 });
      M.drawGear(ctx, pin.G, pin.x, pin.y, A[1], pal.C);
      ctx.restore();
      const v = countValue(0, S.value, p, (x) => M.soft(x));
      if (t >= at) {
        ctx.save(); ctx.globalAlpha = (1 - q) * Math.min(1, span(t, at, at + 0.06) * 2);
        const r = M.ratchet(span(t, at, at + 0.3)), s = 0.9 + 0.1 * r, xr = rtl ? SAFE.right : SAFE.left;
        ctx.translate(xr, yNum); ctx.scale(s, s); ctx.translate(-xr, -yNum);
        kit.number(ctx, text(v), { x: xr, y: yNum, size, color: pal.ink, align: rtl ? 'right' : 'left', settle: p });
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = 1 - q; runs.forEach((r) => M.chip(ctx, pal, r, label.size, span(t, at + 0.7, at + 0.95), rtl)); ctx.restore();
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: pal.grey,
        each: (w, i, box, c) => { if (M.click(c, t, at + 0.4 + i * 0.05, T.dur.word, out0, d, box) === false) return false; if (w.key) return M.keyInk(pal, span(t, at + 0.7, at + 0.95)); } });
    },
  };
}
