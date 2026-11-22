// A number on the beat: a giant figure flush to the reading side ticks up in shrinking steps, while a row of sixteen pulse cells under
// it lights one by one like a step sequencer; on the downbeat the figure lands and a long-exposure trail runs under it. The label is
// written by passing lights below. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, rgba, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, minScale: 1, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 120) size -= 8;
  const yNum = 580, yPips = yNum + size * 0.62, yLabel = yPips + 70 + label.lead / 2;
  const lw = M.layout(kit, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel }), LR = M.runs(lw);
  const land = at + 1.5, n = 16, pw = (maxW - (n - 1) * 8) / n;
  const out0 = d - T.dur.out - 0.1;
  const steps = (p) => { const k = 18, i = Math.floor((1 - (1 - Math.min(1, p)) ** 2) * k); return p >= 1 ? 1 : i / k; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, at, land), out = M.A(span(t, out0, d));
      ctx.save(); ctx.beginPath(); ctx.rect(0, yNum - size * 0.8, W, size * 1.6); ctx.clip(); ctx.translate((rtl ? -1 : 1) * out * W * 0.8, 0);
      if (p > 0) {
        kit.number(ctx, text(countValue(0, S.value, steps(p), (x) => x)), { x: rtl ? SAFE.right : SAFE.left, y: yNum, size, color: pal.light, align: rtl ? 'right' : 'left', settle: steps(p) });
      }
      ctx.restore();
      // the sequencer row: one cell per sixteenth, lit as the count runs, the last one in the accent
      for (let i = 0; i < n; i++) {
        const k = rtl ? n - 1 - i : i, lit = span(t, at + (i / n) * (land - at), at + (i / n) * (land - at) + 0.05);
        const x = SAFE.left + k * (pw + 8), beatOn = i % 4 === 0;
        ctx.fillStyle = lit > 0 && out < 1 ? (i === n - 1 ? pal.accent : rgba(pal.light, (beatOn ? 0.85 : 0.5) * (1 - out))) : rgba(pal.light, 0.08);
        ctx.fillRect(x, yPips - 6, pw, 12);
      }
      const numW = kit.numberWidth(text(S.value), size, 900, 1);
      M.trail(ctx, { x0: rtl ? SAFE.right - numW : SAFE.left, x1: rtl ? SAFE.right : SAFE.left + numW, y: yNum + size * 0.06 }, size * 0.42, span(t, land - 0.05, land + 0.3), rtl, pal, 1 - out);
      for (const r of LR) M.trail(ctx, r, label.size, span(t, at + 0.9, at + 1.3), rtl, pal, 1 - out);
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: pal.grey, key: pal.key,
        each: (w, i, box, c) => {
          const s = at + 0.5 + i * T.dur.step;
          if (M.streakIn(c, span(t, s, s + T.dur.in), box, label.size, rtl, pal) === false) return false;
          if (M.streakOut(c, span(t, out0, out0 + T.dur.out), box, label.size, rtl, pal) === false) return false;
        } });
    },
  };
}
