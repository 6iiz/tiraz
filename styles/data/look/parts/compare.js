// Before and after, charted. When both values are numbers: two columns on a zero baseline, heights true to the values, the old one in
// the quiet series tone and the new one in the accent; each value counts up over its column, and a dashed reference line carries the
// old level across to the new column so the difference reads without reading. When they are words: a short timeline with two marks,
// the old one hollow and the new one filled, joined by an arrow, each labelled on a leader line.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const numeric = typeof S.was === 'number' && typeof S.now === 'number' && S.was >= 0 && S.now >= 0 && Math.max(S.was, S.now) > 0;
  const dec = spec.decimals ?? 0, maxW = SAFE.right - SAFE.left;
  const label = S.label ? kit.fit(S.label, { size: T.size.title + 4, weight: 600, maxW, single: true, where: 'the compare label' }) : null;
  const unit = S.unit ? kit.fit(S.unit, { size: T.size.unit, weight: 500, maxW: 380, single: true, where: 'the compare unit' }) : null;
  // the old value sits on the reading side, the new one after it
  const xWas = rtl ? 760 : 320, xNow = rtl ? 320 : 760, colW = 230;
  const tWas = at + 0.3, tNow = at + 0.9, yLabel = 360;
  const word = (t, t0, size) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.stagger, t0 + i * T.dur.stagger + T.dur.in), box, size, rtl) === false) return false;
    if (M.leave(c, span(t, d - T.dur.out, d), box, size) === false) return false;
  };
  let draw;
  if (numeric) {
    const base = 1130, top = 640, max = Math.max(S.was, S.now), hOf = (v) => (top - base) * -1 * (v / max);
    let vs = T.size.value; while (Math.max(kit.numberWidth(kit.fmt(S.was, dec), vs, 900, 1), kit.numberWidth(kit.fmt(S.now, dec), vs, 900, 1)) > 420 && vs > 40) vs -= 4;
    draw = (ctx, t, fade) => {
      M.rule(ctx, SAFE.left, SAFE.right, base + 1, M.D(span(t, at, at + T.dur.draw)) * fade, pal.axis, 3, rtl);
      const col = (x, v, t0, color, textColor) => {
        const g = M.D(span(t, t0, t0 + 0.7)) * fade, h = hOf(v) * g;
        if (g <= 0) return null;
        ctx.fillStyle = color; ctx.fillRect(x - colW / 2, base - h, colW, h);
        const a = M.E(span(t, t0, t0 + 0.3)) * fade, yv = base - h - 30 - vs * 0.5 - (unit ? unit.lead : 0);
        ctx.save(); ctx.globalAlpha = a;
        kit.number(ctx, kit.fmt(countValue(0, v, span(t, t0, t0 + 0.7), M.D), dec), { x, y: yv, size: vs, color: textColor, settle: span(t, t0, t0 + 0.7) });
        ctx.restore();
        if (unit) kit.drawText(ctx, unit, { x0: x - 200, x1: x + 200, y: yv + vs * 0.5 + unit.lead / 2, color: pal.muted, each: word(t, t0 + 0.2, unit.size) });
        return base - hOf(v);
      };
      const yOld = col(xWas, S.was, tWas, pal.series, pal.muted);
      const yNew = col(xNow, S.now, tNow, pal.accent, pal.keyText);
      // the reference line: the old level carried across to the new column
      const pr = M.D(span(t, tNow + 0.6, tNow + 1.0)) * fade;
      if (yOld !== null && pr > 0) {
        ctx.save(); ctx.strokeStyle = pal.text; ctx.lineWidth = 2; ctx.setLineDash([T.bar.dash, T.bar.dash]);
        const a = xWas + (rtl ? -1 : 1) * colW / 2, b = xNow + (rtl ? -1 : 1) * colW / 2, e = a + (b - a) * pr;
        ctx.beginPath(); ctx.moveTo(a, yOld); ctx.lineTo(e, yOld); ctx.stroke(); ctx.restore();
        // the gap between the two levels, bracketed in the accent on the far side of the new column
        const pg = M.D(span(t, tNow + 0.9, tNow + 1.2)) * fade;
        if (yNew !== null && pg > 0 && Math.abs(yNew - yOld) > 12) {
          const bx = b + (rtl ? -14 : 14), y1 = yOld + (yNew - yOld) * pg;
          ctx.fillStyle = pal.accent; ctx.fillRect(bx - 2, Math.min(yOld, y1), 4, Math.abs(y1 - yOld));
          ctx.fillRect(bx - 10, yOld - 2, 20, 4); if (pg >= 1) ctx.fillRect(bx - 10, yNew - 2, 20, 4);
        }
      }
    };
  } else {
    const [was, now] = kit.fitAll([String(S.was), String(S.now)], { size: T.size.compare, weight: 800, maxW: 420, where: 'a compared value' });
    const yAxis = 960, yText = 700;
    draw = (ctx, t, fade) => {
      const pa = M.D(span(t, at, at + T.dur.draw)) * fade;
      M.rule(ctx, SAFE.left, SAFE.right, yAxis, pa, pal.axis, 2, rtl);
      M.ticks(ctx, SAFE.left, SAFE.right, yAxis, maxW / 10, pa, pal.axis, rtl, 12);
      const pj = M.D(span(t, tWas + 0.3, tNow + 0.1)) * fade;
      if (pj > 0) {
        const a = xWas + (rtl ? -18 : 18), b = xNow + (rtl ? 30 : -30), e = a + (b - a) * pj;
        ctx.fillStyle = pal.accent; ctx.fillRect(Math.min(a, e), yAxis - 3, Math.abs(e - a), 6);
        if (pj >= 1) { const s = rtl ? -1 : 1; ctx.beginPath(); ctx.moveTo(b + s * 12, yAxis); ctx.lineTo(b - s * 14, yAxis - 14); ctx.lineTo(b - s * 14, yAxis + 14); ctx.closePath(); ctx.fill(); }
      }
      const mark = (x, t0, filled) => {
        const g = M.E(span(t, t0, t0 + 0.3)) * fade; if (g <= 0) return;
        ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = filled ? pal.accent : pal.text; ctx.fillStyle = filled ? pal.accent : pal.bg;
        ctx.beginPath(); ctx.arc(x, yAxis, 16 * g, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        M.leader(ctx, [x, yAxis - 40], [x, yText + 70], span(t, t0 + 0.1, t0 + 0.4) * fade, filled ? pal.accent : pal.axis);
      };
      mark(xWas, tWas, false); mark(xNow, tNow, true);
      kit.drawText(ctx, was, { x0: xWas - 210, x1: xWas + 210, y: yText, color: pal.muted, key: pal.muted, each: word(t, tWas + 0.2, was.size) });
      kit.drawText(ctx, now, { x0: xNow - 210, x1: xNow + 210, y: yText, color: pal.keyText, key: pal.keyText, each: word(t, tNow + 0.2, now.size) });
    };
  }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = 1 - M.D(span(t, d - T.dur.out, d));
      if (label) {
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: pal.text, each: word(t, at, label.size) });
        const pm = M.E(span(t, at, at + 0.3)) * fade;
        if (pm > 0) { ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? SAFE.right - 64 * pm : SAFE.left, yLabel - label.lead / 2 - 22, 64 * pm, 6); }
      }
      draw(ctx, t, fade);
    },
  };
}
