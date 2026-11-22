// A number computed by the sheet: the label sits in a merged range, a counting formula is typed into the bar with a dashed reference
// box around its range, and the range's cells fire one after another (a flash, then the accent fill, a faint 1 in each). When the value is
// a whole number from 1 to 60, one cell is one unit and the result cell counts up with each cell that fires: the picture is the number.
// Otherwise forty cells fire in step with the count and claim no unit. The result lands in a big merged cell under the label.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says, rtl = kit.rtl;
  if (typeof S0.value !== 'number') throw new Error('the count spec\'s "value" must be a number');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette, S = M.sheet(T, W, rtl);
  const all = S.rect(0, 0, S.cols - 1, 0), x0 = Math.max(all.x + 26, SAFE.left + 6), x1 = Math.min(all.x + all.w - 26, SAFE.right - 6), maxW = x1 - x0;
  const text = (v) => (S0.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S0.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S0.value), size, 900, 1) > maxW && size > 100) size -= 8;
  const label = M.balanced(kit, S0.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const unit = Number.isInteger(S0.value) && S0.value >= 1 && S0.value <= 60, n = unit ? S0.value : 40;
  const nLabel = M.rowsFor(label, S.rh, 0.3), nNum = Math.ceil((size * 1.15) / S.rh), nBlock = Math.ceil(n / S.cols);
  const r0 = 1, rN = r0 + nLabel + 1, rB = rN + nNum + 1;
  const yLabel = S.yOf(r0) + (nLabel * S.rh) / 2 - ((label.rows.length - 1) * label.lead) / 2, yNum = S.yOf(rN) + (nNum * S.rh) / 2;
  const block = S.rect(0, rB, S.cols - 1, rB + nBlock - 1);
  const formula = `=SUM(${M.ref(0, rB)}:${M.ref(S.cols - 1, rB + nBlock - 1)})`;
  const enter = at + 0.15 + formula.length * T.dur.char, f0 = enter + 0.05, f1 = at + 1.7, dt = (f1 - f0) / n;
  const mono = ground.mono;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fired = Math.max(0, Math.min(n, Math.floor((t - f0) / dt) + 1));
      M.formulaBar(ctx, T, P, mono, t, at + 0.15, M.ref(0, rN), formula, W);
      M.merged(ctx, S, 0, r0, S.cols - 1, r0 + nLabel - 1, P);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.muted });
      M.refBox(ctx, block, P, t, span(t, at + 0.3, at + 0.45) * (1 - span(t, f1 + 0.3, f1 + 0.6)));
      ctx.save(); ctx.font = `500 ${T.size.value}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      for (let k = 0; k < n; k++) {
        const c = k % S.cols, r = rB + Math.floor(k / S.cols), R = S.rect(c, r);
        if (M.paint(ctx, R, t, f0 + k * dt, P.accent, P, T.dur.flash)) { ctx.fillStyle = P.on(P.accent); ctx.globalAlpha = 0.45; ctx.fillText('1', R.x + R.w / 2, R.y + R.h / 2 + 1); ctx.globalAlpha = 1; }
      }
      ctx.restore();
      const R = M.merged(ctx, S, 0, rN, S.cols - 1, rN + nNum - 1, P);
      const done = t >= f1, shownV = unit ? fired : countValue(0, S0.value, span(t, f0, f1), (p) => p);
      if (t >= enter) {
        const pop = 1 + 0.1 * (1 - span(t, f1, f1 + 0.18)) * (done ? 1 : 0);           // the result pops once when the last cell fires
        if (done && t < f1 + T.dur.flash) { ctx.fillStyle = P.headOn; ctx.fillRect(R.x + 2, R.y + 2, R.w - 4, R.h - 4); }
        ctx.save(); ctx.translate(rtl ? x1 : x0, yNum); ctx.scale(pop, pop); ctx.translate(-(rtl ? x1 : x0), -yNum);
        kit.number(ctx, text(done ? S0.value : shownV), { x: rtl ? x1 : x0, y: yNum, size, color: P.ink, align: rtl ? 'right' : 'left', settle: done ? 1 : 0 });
        ctx.restore();
        M.selection(ctx, done ? R : S.rect(fired ? (fired - 1) % S.cols : 0, rB + Math.floor(Math.max(0, fired - 1) / S.cols)), P, t, rtl, done);
      }
    },
  };
}
