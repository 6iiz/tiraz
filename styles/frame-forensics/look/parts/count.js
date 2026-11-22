// A number as a measured reading: a data trace is drawn across a panel at the top while a playhead with its own clock runs along it;
// the readout under the panel counts with the playhead and stops when it does. On the stop a ring marks the point on the trace, a
// dashed drop line joins it to the readout, and corner brackets close around the number. The label is set like a transcription.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const maxW = SAFE.right - SAFE.left, x0 = SAFE.left, x1 = SAFE.right;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.88, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 700, 1) > maxW - 120 && size > 100) size -= 8;
  const py = T.frame.top, ph = 400, yNum = py + ph + 110 + size * 0.45, yLabel = yNum + size * 0.62 + 40 + label.lead / 2;
  const keyRuns = M.runs(M.boxes(kit, label, { x0, x1, y: yLabel, align: 'start' }));
  // the trace: a seeded walk that ends on its highest point
  const r = rng(808), N = 90, pts = [];
  let v = 0.25; for (let i = 0; i < N; i++) { v = Math.min(0.8, Math.max(0.08, v + (r() - 0.45) * 0.09)); pts.push(v); }
  pts[N - 1] = 0.9; pts[N - 2] = Math.max(pts[N - 2], 0.6);
  const X = (u) => (rtl ? x1 - 30 - (maxW - 60) * u : x0 + 30 + (maxW - 60) * u), Y = (val) => py + ph - 40 - (ph - 80) * val;
  const tEnd = at + 1.5;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out), u = M.IO(span(t, at, tEnd));
      ctx.fillStyle = P.panel; ctx.fillRect(x0, py, maxW, ph); ctx.strokeStyle = P.rule; ctx.lineWidth = 2; ctx.strokeRect(x0, py, maxW, ph);
      ctx.fillStyle = P.rule; for (let k = 1; k < 4; k++) ctx.fillRect(x0 + 1, py + ph * k / 4, maxW - 2, 1);
      for (let k = 0; k <= 12; k++) ctx.fillRect(X(k / 12), py + ph - 14, 1, 14);
      // the trace up to the playhead
      ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      const n = Math.max(1, Math.floor(u * (N - 1)));
      for (let i = 0; i <= n; i++) { const xx = X(i / (N - 1)), yy = Y(pts[i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      const fr = u * (N - 1) - n; if (n < N - 1) ctx.lineTo(X(u), Y(pts[n] + (pts[n + 1] - pts[n]) * fr));
      ctx.stroke(); ctx.restore();
      // the playhead and its clock
      const hx = X(u); ctx.fillStyle = P.mark; ctx.fillRect(hx - 1, py, 2, ph);
      M.code(ctx, 'T+' + (u * 41.6).toFixed(1).padStart(4, '0'), hx + (rtl ? -10 : 10), py + 24, { mono, size: T.size.code, color: P.mark, align: rtl ? 'right' : 'left', weight: 600 });
      // the stop: ring on the point, dashed drop to the readout, brackets round the number
      const st = span(t, tEnd, tEnd + 0.35);
      ctx.save(); ctx.globalAlpha = keep;
      M.ring(ctx, X(1), Y(pts[N - 1]), 26, M.E(st), P.mark, 3);
      if (st > 0) { ctx.strokeStyle = P.mark; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(X(1), Y(pts[N - 1]) + 30); ctx.lineTo(X(1), Y(pts[N - 1]) + 30 + (py + ph + 40 - Y(pts[N - 1])) * M.E(st)); ctx.stroke(); ctx.setLineDash([]); }
      const nw = kit.numberWidth(text(S.value), size, 700, 1), bx = rtl ? x1 - nw - 60 : x0, bw = nw + 60;
      M.brackets(ctx, bx, yNum - size * 0.62, bw, size * 1.2, M.E(span(t, tEnd + 0.1, tEnd + 0.4)), P.mark, 34, 3);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = keep * Math.min(1, span(t, at - 0.1, at + 0.15));
      kit.number(ctx, text(countValue(0, S.value, u, (x) => x)), { x: rtl ? x1 - 30 : x0 + 30, y: yNum, size, weight: 700, color: P.ink, align: rtl ? 'right' : 'left', settle: u });
      ctx.restore();
      const hp = M.E(span(t, at + 0.8, at + 0.8 + T.dur.wipe)) * keep;
      for (const k of keyRuns) M.highlight(ctx, k, label.size, hp, P, rtl);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.grey, key: P.ink,
        each: (w, i, box, c) => { const s0 = at + 0.4 + i * T.dur.stagger; if (M.set(c, span(t, s0, s0 + T.dur.in), out, label.size) === false) return false; if (w.key && hp > 0.5) return P.onAccent; } });
    },
  };
}
