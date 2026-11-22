// Before and after as two pieces of evidence on one clock. The earlier source is a panel with its timecode; when the later one
// contradicts it, its border turns to a dashed line (no longer confirmed), its value dims and a thin rule crosses it. The later source
// is then drawn under it, solid, with corner brackets, and its value carries the accent highlight. A short vertical connector between
// them carries the time that separates them. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v).replace(/\*/g, '')) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left, pad = 44;
  const [was, now] = kit.fitAll([asText(S.was), '*' + asText(S.now) + '*'], { size: T.size.compare, weight: 700, maxW: maxW - pad * 2, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.95, where: 'the compare label' }) : null;
  const yLabel = 420, cardH = (f) => f.height + 96;
  const yA = yLabel + (label ? label.height : 0) + 40, hA = cardH(was), yB = yA + hA + 120, hB = cardH(now);
  const posA = { x0: SAFE.left + pad, x1: SAFE.right - pad, y: yA + 64 + was.lead / 2, align: 'start' }, posB = { x0: SAFE.left + pad, x1: SAFE.right - pad, y: yB + 64 + now.lead / 2, align: 'start' };
  const runsB = M.runs(M.boxes(kit, now, posB));
  const cutT = at + 0.95, nowT = at + 1.35;
  const tag = (txt, y, color) => M.code(ctx0, txt, rtl ? SAFE.right - 20 : SAFE.left + 20, y + 28, { mono, size: T.size.code - 2, color, align: rtl ? 'right' : 'left' });
  let ctx0 = null;
  return {
    duration: d,
    draw(ctx, t) {
      ctx0 = ctx; ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel + label.lead / 2, align: 'start', color: P.grey,
        each: (w, i, box, c) => { const s0 = at + i * T.dur.stagger; if (M.set(c, span(t, s0, s0 + T.dur.in), out, label.size) === false) return false; } });
      // card A: the earlier source
      const pa = M.E(span(t, at + 0.1, at + 0.4)), cut = span(t, cutT, cutT + 0.3);
      if (pa > 0) {
        ctx.save(); ctx.globalAlpha = keep * Math.min(1, pa * 2);
        ctx.fillStyle = P.panel; ctx.fillRect(SAFE.left, yA, maxW, hA * pa);
        ctx.strokeStyle = cut > 0 ? P.grey : P.rule; ctx.lineWidth = 2; if (cut > 0) ctx.setLineDash([10, 9]); ctx.strokeRect(SAFE.left, yA, maxW, hA * pa); ctx.setLineDash([]);
        tag(cut > 0 ? '≈ 00:14:02' : '00:14:02', yA, P.grey);
        ctx.restore();
      }
      kit.drawText(ctx, was, { ...posA, color: cut > 0 ? P.grey : P.ink, key: P.ink,
        each: (w, i, box, c) => { const s0 = at + 0.25 + i * T.dur.stagger; if (M.set(c, span(t, s0, s0 + T.dur.in), out, was.size) === false) return false; if (cut > 0) c.globalAlpha *= 1 - 0.35 * cut; } });
      if (cut > 0) { const lw = (was.width + 20) * M.E(cut) * keep; ctx.fillStyle = P.ink; for (let r = 0; r < was.rows.length; r++) ctx.fillRect(rtl ? posA.x1 + 10 - lw : posA.x0 - 10, posA.y + r * was.lead + 2, lw, 3); }
      // the connector with the gap between the sources
      const cp = M.E(span(t, cutT + 0.1, nowT)) * keep, cx = rtl ? SAFE.right - 60 : SAFE.left + 60;
      if (cp > 0) { ctx.fillStyle = P.mark; ctx.fillRect(cx - 1, yA + hA, 2, 120 * cp); M.code(ctx, 'Δ +06:41', cx + (rtl ? -16 : 16), yA + hA + 60, { mono, size: T.size.code - 2, color: P.mark, align: rtl ? 'right' : 'left' }); }
      // card B: the later source, confirmed
      const pb = M.E(span(t, nowT - 0.1, nowT + 0.2));
      if (pb > 0) {
        ctx.save(); ctx.globalAlpha = keep * Math.min(1, pb * 2);
        ctx.fillStyle = P.panel; ctx.fillRect(SAFE.left, yB, maxW, hB * pb); ctx.strokeStyle = P.rule; ctx.lineWidth = 2; ctx.strokeRect(SAFE.left, yB, maxW, hB * pb);
        M.brackets(ctx, SAFE.left - 8, yB - 8, maxW + 16, hB + 16, M.E(span(t, nowT + 0.2, nowT + 0.5)), P.mark, 34, 3);
        tag('00:20:43', yB, P.ink);
        ctx.restore();
      }
      const hp = M.E(span(t, nowT + 0.3, nowT + 0.3 + T.dur.wipe)) * keep;
      for (const r of runsB) M.highlight(ctx, r, now.size, hp, P, rtl);
      kit.drawText(ctx, now, { ...posB, color: P.ink, key: P.ink,
        each: (w, i, box, c) => { const s0 = nowT + i * T.dur.stagger; if (M.set(c, span(t, s0, s0 + T.dur.in), out, now.size) === false) return false; if (hp > 0.5) return P.onAccent; } });
    },
  };
}
