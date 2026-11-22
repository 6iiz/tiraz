// A line in the sheet: a formula is typed into the bar, Enter drops the lead and the statement into two merged ranges at once, and the
// cells under the key phrase (*…*) fire their rule: they flash and settle into the accent fill, one block per phrase, and the selection
// lands on them with its fill handle. Under the statement a row of cells keeps firing one after another through a five-step scale
// while the line holds. spec: { duration, at?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette, S = M.sheet(T, W, rtl);
  const all = S.rect(0, 0, S.cols - 1, 0), x0 = Math.max(all.x + 26, SAFE.left + 6), x1 = Math.min(all.x + all.w - 26, SAFE.right - 6), maxW = x1 - x0;
  const line = M.balanced(kit, spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? M.balanced(kit, spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const nLead = lead ? M.rowsFor(lead, S.rh, 0.3) : 0, nLine = M.rowsFor(line, S.rh, 0.8);
  const total = (lead ? nLead + 1 : 0) + nLine + 2;
  const r0 = Math.max(1, Math.round((700 - (total * S.rh) / 2 - S.top) / S.rh));
  const rL = r0 + (lead ? nLead + 1 : 0), rD = rL + nLine + 1;
  const mid = (f, r, n) => S.yOf(r) + (n * S.rh) / 2 - ((f.rows.length - 1) * f.lead) / 2;
  const yLead = lead ? mid(lead, r0, nLead) : 0, yLine = mid(line, rL, nLine);
  const keys = M.keySpans(line, x0, x1, yLine, 'start', rtl).map((s) => M.cellsUnder(S, s, line.size));
  const formula = `=CONCAT(${M.ref(0, rL)}:${M.ref(S.cols - 1, rL + nLine - 1)})`;
  const enter = at + Math.min(0.36, formula.length * T.dur.char);
  const fireAt = (k, i) => enter + 0.03 + k * 0.05 + Math.min(i * 0.004, 0.12);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const shown = t >= enter;
      M.formulaBar(ctx, { ...T, dur: { ...T.dur, char: (enter - at) / formula.length } }, P, ground.mono, t, at, shown && keys.length ? M.ref(keys[0].c0, keys[0].r0) : M.ref(0, rL), formula, W);
      if (lead) M.merged(ctx, S, 0, r0, S.cols - 1, r0 + nLead - 1, P);
      M.merged(ctx, S, 0, rL, S.cols - 1, rL + nLine - 1, P);
      // the row that keeps firing under the line
      for (let c = 0; c < S.cols; c++) {
        const R = S.rect(c, rD), f = enter + 0.5 + c * 0.24;
        if (!M.paint(ctx, R, t, f, P.scale[Math.min(4, Math.floor((c * 5) / S.cols))], P, T.dur.flash)) { if (t >= f - 0.24 && t < f) M.refBox(ctx, R, P, t, 0.6); continue; }
      }
      if (shown) {
        keys.forEach((k, j) => k.cells.forEach((q, i) => M.paint(ctx, q, t, fireAt(j, i), P.accent, P, T.dur.flash)));
        if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: P.muted });
        kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: P.ink, key: P.on(P.accent) });
        if (keys.length && t >= fireAt(0, 0) + 0.1) M.selection(ctx, keys[0].rect, P, t, rtl);
      } else {
        M.selection(ctx, S.rect(0, rL), P, t, rtl, false);
      }
    },
  };
}
