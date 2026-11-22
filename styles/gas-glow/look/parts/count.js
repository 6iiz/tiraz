// A number as a big tube sign: the figure hangs as clear glass, and a ladder of short tubes beside it climbs rung by rung like the
// transformer charging (one switch a rung); with the last rung, the accent figure strikes and its gas runs through it from the
// first digit to the last. The label under it is a row of smaller tubes switched on after it, a key phrase in the accent circuit.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, ladW = 70, nx0 = rtl ? x0 + ladW + 30 : x0, nx1 = rtl ? x1 : x1 - ladW - 30;
  const str = (S.prefix ?? '') + kit.fmt(S.value, spec.decimals ?? 0) + (S.suffix ?? '');
  const num = kit.fit(str, { size: T.size.count, weight: 800, maxW: nx1 - nx0, single: true, where: 'the number' });
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minPx: 46, where: 'the count label' });
  const block = num.lead * 0.82 + label.height, top = kit.place(block, 690);
  const yNum = top + num.lead * 0.41, yLabel = top + num.lead * 0.82 + label.lead / 2;
  const numSign = M.sign(num, { x0: nx0, x1: nx1, y: yNum, align: rtl ? 'end' : 'start' }, pal, false, { tube: 'key' });
  const labSign = M.sign(label, { x0, x1, y: yLabel }, pal, rtl);
  const rungs = 8, c0 = at + 0.2, c1 = at + 1.3, ladX = rtl ? x0 + ladW / 2 : x1 - ladW / 2, ladTop = yNum - num.size * 0.55, ladBot = yNum + num.size * 0.55;
  const slot = []; let k = -1, prev = false; for (const w of labSign.words) { if (!(w.key && prev)) k++; slot[w.index] = k; prev = w.key; }
  const nl = k + 1, lStep = nl <= 1 ? 0 : Math.min(T.dur.step, 0.6 / (nl - 1));
  return {
    duration: d,
    draw(ctx, t) {
      const time = t + clock, power = span(t, c0, c1 + 0.5);
      ground.draw(ctx, t, { power });
      ground.spill(ctx, W / 2, yNum, 600, 360, pal.key.glow, span(t, c1, c1 + 0.3));
      for (let i = 0; i < rungs; i++) {                                         // the ladder: glass rungs, lit bottom to top
        const y = ladBot - (i + 0.5) * ((ladBot - ladTop) / rungs), on = M.strike(span(t, c0 + (i / rungs) * (c1 - c0), c0 + (i / rungs) * (c1 - c0) + 0.18), i + 3);
        ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = pal.glass; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(ladX - 26, y); ctx.lineTo(ladX + 26, y); ctx.stroke();
        if (on > 0) { const c = i === rungs - 1 ? pal.key : pal.main; ctx.globalAlpha = on * M.hum(time, i); ctx.shadowColor = c.glow; ctx.shadowBlur = 22; ctx.strokeStyle = c.tube; ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = c.core; ctx.lineWidth = 4; ctx.stroke(); }
        ctx.restore();
      }
      numSign.draw(ctx, () => { const p = span(t, c1, c1 + 0.6); return { run: p * 1.15, b: M.strike(p, 9) * M.hum(time, 9) }; });
      numSign.rec(kit);
      labSign.draw(ctx, (i) => { const L = M.sequence(t, at + 0.35, lStep, T.dur.strike, slot[i], 4); L.b *= M.hum(time, slot[i]); return L; });
      labSign.rec(kit);
      ground.glass(ctx, t);
    },
  };
}
