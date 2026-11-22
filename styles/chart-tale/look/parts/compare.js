// Before and after, read as two points of the same line. The old value is pinned to a low point the line has already passed (on the
// past side of the frame), written in grey and then struck through by hand. When the pencil reaches its new point, an accent dot is
// set there, a dashed level runs over from the old point and an accent arrow climbs the difference; the new value is written over
// it and circled. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, mid = W / 2, half = (x1 - x0) / 2 - 30;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: half - 40, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: x1 - x0, minPx: 46, where: 'the compare label' }) : null;
  const lh = label ? label.height + 24 : 0, vh = Math.max(was.height, now.height);
  const top = kit.place(lh + vh, 610), yLabel = top + (label ? label.lead / 2 : 0), yVal = top + lh + was.lead / 2, bottom = top + lh + vh + 24;
  // the old side and the new side of the frame follow the chart's direction of time
  const oldX = rtl ? [mid + 30, x1 - 20] : [x0 + 20, mid - 30], newX = rtl ? [x0 + 20, mid - 30] : [mid + 30, x1 - 20];
  const nowT = at + 1.3, cutT = at + 0.85, wxTip = ground.wxAt(clock + nowT);
  // the new point: the highest the line has reached lately; the old one: the lowest some way before it
  let wxNow = wxTip, wxWas = wxTip - 360, best = -9;
  for (let a = wxTip - 240; a <= wxTip; a += 8) for (let b = a - 460; b <= a - 260; b += 8) {
    const g = ground.value(a) - ground.value(b); if (g > best) { best = g; wxNow = a; wxWas = b; }
  }
  const out = (t) => span(t, d - T.dur.out, d);
  const word = (t, t0, size, o) => (w, i, box, c) => { const s = t0 + i * 0.08; if (M.write(c, span(t, s, s + T.dur.in), box, size, rtl) === false) return false; if (M.erase(c, o) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { pen: false });
      const o = out(t), a = 1 - M.OUT(o), pw = ground.point(wxWas, t), pn = ground.point(wxNow, t);
      // the old point and its note
      M.stem(ctx, pw, bottom, span(t, at, at + 0.3) * a, pal, { ring: pal.muted });
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; M.dot(ctx, pw[0], pw[1], 11, pal, false); ctx.restore(); }
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.muted, each: word(t, at + 0.1, label.size, o) });
      kit.drawText(ctx, was, { x0: oldX[0], x1: oldX[1], y: yVal, align: 'center', color: pal.muted, key: pal.muted, each: word(t, at + 0.3, was.size, o) });
      const sp = span(t, cutT, cutT + 0.3);
      if (sp > 0 && a > 0) {                                                 // struck through by hand, there and back
        const r = { x0: (oldX[0] + oldX[1] - was.rows[0].width) / 2 - 16, x1: (oldX[0] + oldX[1] + was.rows[0].width) / 2 + 16 }, L = r.x1 - r.x0;
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = pal.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        const s0 = rtl ? r.x1 : r.x0, dirX = rtl ? -1 : 1, q = M.E(sp) * 2;
        ctx.moveTo(s0, yVal - 6); ctx.lineTo(s0 + dirX * L * Math.min(1, q), yVal - 6 + 10 * Math.min(1, q));
        if (q > 1) ctx.lineTo(s0 + dirX * L * (1 - (q - 1)), yVal + 10 - 4 * (q - 1));
        ctx.stroke(); ctx.restore();
      }
      // the new point: set when the pencil reaches it, then the level and the arrow of the difference
      const np = M.E(span(t, nowT - 0.05, nowT + 0.2)) * a;
      if (np > 0) {
        const lp = M.E(span(t, nowT, nowT + 0.3)), ap = M.E(span(t, nowT + 0.2, nowT + 0.5));
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = pal.muted; ctx.lineWidth = 3; ctx.setLineDash([10, 9]);
        ctx.beginPath(); ctx.moveTo(pw[0], pw[1]); ctx.lineTo(pw[0] + (pn[0] - pw[0]) * lp, pw[1]); ctx.stroke(); ctx.setLineDash([]);
        if (ap > 0 && Math.abs(pn[1] - pw[1]) > 30) {
          const y0 = pw[1], y1 = pw[1] + (pn[1] - pw[1]) * ap, s = Math.sign(pn[1] - pw[1]);
          ctx.strokeStyle = pal.line; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pn[0], y0); ctx.lineTo(pn[0], y1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pn[0] - 14, y1 - s * 16); ctx.lineTo(pn[0], y1); ctx.lineTo(pn[0] + 14, y1 - s * 16); ctx.stroke();
        }
        ctx.restore();
        M.stem(ctx, pn, bottom, span(t, nowT + 0.05, nowT + 0.35) * a, pal);
        ctx.save(); ctx.globalAlpha = a; M.dot(ctx, pn[0], pn[1], 14 * np, pal, true); ctx.restore();
      }
      kit.drawText(ctx, now, { x0: newX[0], x1: newX[1], y: yVal, align: 'center', color: pal.ink, key: pal.keyText, each: word(t, nowT + 0.2, now.size, o) });
      const nr = { x0: (newX[0] + newX[1] - now.rows[0].width) / 2, x1: (newX[0] + newX[1] + now.rows[0].width) / 2, y: yVal };
      ctx.save(); if (M.erase(ctx, o) !== false) M.loop(ctx, nr, now.size, span(t, nowT + 0.45, nowT + 0.8), pal.line, 2); ctx.restore();
      ground.pen(ctx, t);
    },
  };
}
