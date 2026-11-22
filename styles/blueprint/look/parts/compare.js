// Before and after as a drawing revision. The old value is drawn as a hidden line (dimmed, in a dashed box) and crossed out by the
// pen; a leader carries the eye down to the new value, which is traced in a solid accent box with a revision triangle beside it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const ink = ground.ink, rtl = kit.rtl, L = SAFE.left, R = SAFE.right, pad = T.space.pad, tri = 76;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: R - L - 2 * pad - tri, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead + 4, weight: 500, maxW: R - L, single: true, where: 'the compare label' }) : null;
  const yLabel = 450, yWas = 620, yNow = 930;
  const boxOf = (f, y) => { const w = f.width + 2 * pad, h = f.height + pad; return { x: rtl ? R - w : L, y: y - f.lead / 2 - pad / 2, w, h }; };
  const bw = boxOf(was, yWas), bn = boxOf(now, yNow);
  const out0 = d - T.dur.out, cutT = at + 0.85, nowT = at + 1.35;
  const plotIn = (t, t0, size, colour) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size, rtl, ink.accent) === false) return false;
    if (M.leave(c, span(t, out0, d), box, size, rtl) === false) return false;
    return colour;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const gone = 1 - span(t, out0, d);
      if (label) kit.drawText(ctx, label, { x0: L, x1: R, y: yLabel, align: 'start', color: ink.dim, each: plotIn(t, at, label.size) });
      // the old value: a hidden line
      ctx.strokeStyle = rgba(ink.light, T.tone.line); ctx.lineWidth = 1.5; ctx.setLineDash([14, 9]);
      M.rect(ctx, bw.x, bw.y, bw.w, bw.h, span(t, at, at + 0.5) * gone, rtl); ctx.setLineDash([]);
      kit.drawText(ctx, was, { x0: bw.x + pad, x1: bw.x + bw.w - pad, y: yWas, align: 'start', color: ink.dim, key: ink.dim, each: plotIn(t, at + 0.2, was.size) });
      ctx.strokeStyle = ink.light; ctx.lineWidth = 3;
      const xs0 = rtl ? bw.x + bw.w : bw.x, xs1 = rtl ? bw.x : bw.x + bw.w;
      M.seg(ctx, xs0, bw.y, xs1, bw.y + bw.h, span(t, cutT, cutT + 0.2) * gone);
      M.seg(ctx, xs0, bw.y + bw.h, xs1, bw.y, span(t, cutT + 0.2, cutT + 0.4) * gone);
      // the leader down to the new value, with its arrowhead
      const lx = rtl ? R - 60 : L + 60, y0 = bw.y + bw.h + 14, y1 = bn.y - 14, pl = span(t, nowT - 0.45, nowT - 0.1) * gone;
      ctx.strokeStyle = rgba(ink.light, T.tone.line); ctx.lineWidth = 1.5;
      M.seg(ctx, lx, y0, lx, y1, pl);
      if (pl >= 1) { ctx.fillStyle = ink.light; ctx.beginPath(); ctx.moveTo(lx, y1); ctx.lineTo(lx - 10, y1 - 26); ctx.lineTo(lx + 10, y1 - 26); ctx.closePath(); ctx.fill(); }
      ctx.beginPath(); ctx.fillStyle = ink.light; if (pl > 0) { ctx.arc(lx, y0, 4, 0, Math.PI * 2); ctx.fill(); }
      // the new value, traced in the accent pen, with its revision triangle
      ctx.strokeStyle = ink.accent; ctx.lineWidth = 2.5;
      M.rect(ctx, bn.x, bn.y, bn.w, bn.h, span(t, nowT, nowT + 0.5) * gone, rtl);
      const tx = rtl ? bn.x - tri / 2 : bn.x + bn.w + tri / 2, ty = yNow, s = 26;
      M.poly(ctx, [[tx, ty - s], [tx - s * 1.1, ty + s * 0.8], [tx + s * 1.1, ty + s * 0.8], [tx, ty - s]], span(t, nowT + 0.3, nowT + 0.6) * gone);
      kit.drawText(ctx, now, { x0: bn.x + pad, x1: bn.x + bn.w - pad, y: yNow, align: 'start', color: ink.key, key: ink.key, each: plotIn(t, nowT + 0.1, now.size) });
    },
  };
}
