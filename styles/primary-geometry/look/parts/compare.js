// Before and after: the old value sits on a slate plate in a quiet tone; an accent bar hinged at its reading side swings down and
// locks across it as a slash. Then a paper plate locks together below and the rolling square types the new value in ink, with an
// accent disc snapping onto the plate's corner. The label rides above on the night ground.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, pad = T.plate.pad, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const inW = SAFE.right - SAFE.left - pad * 2;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: inW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: inW, minScale: 0.88, where: 'the compare label' }) : null;
  const hW = was.height + pad * 1.4, hN = now.height + pad * 1.4, labH = label ? label.height + 20 : 0;
  const top = kit.place(labH + hW + 60 + hN, 740);
  const pw = { x: SAFE.left, y: top + labH, w: SAFE.right - SAFE.left, h: hW }, pn = { x: SAFE.left, y: pw.y + hW + 60, w: SAFE.right - SAFE.left, h: hN };
  const x0 = SAFE.left + pad, x1 = SAFE.right - pad;
  const tCut = at + 0.95, tNow = at + 1.35, hingeX = rtl ? SAFE.right - 20 : SAFE.left + 20;
  const slashLen = pw.w + 40, slashA = (rtl ? 1 : -1) * 0.16;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      if (label && out < 0.4) { ctx.fillStyle = P.night; ctx.fillRect(SAFE.left - 10, top - 6, SAFE.right - SAFE.left + 20, label.height + 12); }
      if (label && out < 0.4) M.typeset(ctx, kit, label, { x0: SAFE.left, x1: SAFE.right, y: top + label.lead / 2, t, t0: at, pal: P, T, color: P.light });
      M.stage(ctx, pw, span(t, at + 0.1, at + 0.1 + T.dur.stage), out, P.slate, () =>
        M.typeset(ctx, kit, was, { x0, x1, y: pw.y + pad * 0.7 + was.lead / 2, t, t0: at + 0.1 + T.dur.stage, pal: P, T, color: P.onSlate }));
      // the slash: a bar hinged at the reading side swings from upright down across the old value and locks
      const ps = span(t, tCut, tCut + T.dur.lever);
      if (ps > 0 && out < 1) {
        const up = rtl ? M.Q : -M.Q, ang = slashA + up * (1 - M.SNAP(ps)), ym = pw.y + pw.h / 2;
        ctx.save(); ctx.globalAlpha = 1 - M.OUT(out); ctx.translate(hingeX, ym); ctx.rotate(ang); ctx.fillStyle = P.accent;
        ctx.fillRect(rtl ? -slashLen : 0, -9, slashLen, 18); ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      M.stage(ctx, pn, span(t, tNow, tNow + T.dur.stage), out, P.paper, () => {
        M.typeset(ctx, kit, now, { x0, x1, y: pn.y + pad * 0.7 + now.lead / 2, t, t0: tNow + T.dur.stage, pal: P, T });
        const pd = M.SNAP(span(t, tNow + T.dur.stage + 0.25, tNow + T.dur.stage + 0.45));
        if (pd > 0) { ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(rtl ? pn.x : pn.x + pn.w, pn.y, 34 * pd, 0, Math.PI * 2); ctx.fill(); }
      }, true);
    },
  };
}
