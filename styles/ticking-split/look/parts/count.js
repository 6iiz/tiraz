// A number in real time: the clock counts down to the moment the figure lands. The frame starts as one cell with the figure counting;
// then it is cut: a cell for the label opens under it, then a third cell with a process bar of ten segments that fill in step with the
// count (it keeps time; it shows no share). At zero the figure lands, the cells close into one picture and the clock flips.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock: clk, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, A = T.area, gut = T.gutter;
  if (typeof S.value !== 'number') throw new Error('the count spec\'s "value" must be a number');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock: clk });
  const M = await import(look.base + 'motion.js'), P = ground.palette, mono = ground.mono, vig = M.vignette(P);
  const x0 = Math.max(A.x0 + 40, SAFE.left + 6), x1 = Math.min(A.x1 - 40, SAFE.right - 6), maxW = x1 - x0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 100) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const hA = Math.round(size * 1.15 + 90), hB = Math.round(label.height + 80);
  const full = { x: A.x0, y: A.y0, w: A.x1 - A.x0, h: A.y1 - A.y0 };
  const RA = { ...full, h: hA }, RB = { x: A.x0, y: A.y0 + hA + gut, w: full.w, h: hB }, RC = { x: A.x0, y: RB.y + hB + gut, w: full.w, h: A.y1 - (RB.y + hB + gut) };
  const yNum = A.y0 + 50 + size * 0.6, yLabel = RB.y + 40 + label.lead / 2;
  const cutB = at + 0.35, cutC = at + 0.8, zero = at + 1.6;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.clock(ctx, t, zero, P, mono, rtl, M.clockBox(T, rtl));
      const m = M.snap(span(t, zero, zero + T.dur.merge)), split = 1 - m;
      const b = M.snap(span(t, cutB, cutB + T.dur.cut)), c = M.snap(span(t, cutC, cutC + T.dur.cut));
      // one cell, then cut into three; at zero they close again (the gutters fill and the borders between them go)
      M.cell(ctx, full, P, mono, rtl, { border: 1, vignette: vig, chip: 0 });
      if (split > 0) {
        ctx.save(); ctx.globalAlpha = split;
        if (b > 0) { ctx.fillStyle = P.gutter; ctx.fillRect(A.x0, RA.y + RA.h, full.w * b, gut); M.cell(ctx, { ...RB, w: RB.w * b, x: rtl ? RB.x + RB.w * (1 - b) : RB.x }, P, mono, rtl, { fill: false, code: b >= 1 ? 'DOC' : '', live: false }); }
        if (c > 0) { ctx.fillStyle = P.gutter; ctx.fillRect(A.x0, RC.y - gut, full.w * c, gut); M.cell(ctx, { ...RC, w: RC.w * c, x: rtl ? RC.x + RC.w * (1 - c) : RC.x }, P, mono, rtl, { fill: false, code: c >= 1 ? 'LIST' : '' }); }
        M.cell(ctx, b > 0 ? RA : full, P, mono, rtl, { fill: false, code: 'CAM 1' });
        ctx.restore();
      }
      const p = span(t, at + 0.1, zero), shown = countValue(0, S.value, p, (q) => q);
      kit.number(ctx, text(t >= zero ? S.value : shown), { x: rtl ? x1 : x0, y: yNum, size, color: t >= zero ? P.keyText : P.text, align: rtl ? 'right' : 'left', settle: t >= zero ? 1 : 0 });
      if (b > 0) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.muted,
        each: (w, i, box, cx) => { if (b < 1) return false; } });
      if (c > 0) {                                                     // the process bar: ten segments filling with the count
        const segs = 10, sw = (maxW - 9 * 8) / segs, by = RC.y + Math.min(RC.h / 2, 110), filled = Math.min(segs, Math.floor(p * segs + 1e-6));
        for (let i = 0; i < segs; i++) {
          const sx = rtl ? x1 - (i + 1) * sw - i * 8 : x0 + i * (sw + 8);
          ctx.fillStyle = i < filled ? P.accent : P.border; ctx.fillRect(sx, by - 14, sw * (c >= 1 ? 1 : 0), 28);
        }
      }
    },
  };
}
