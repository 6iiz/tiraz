// Before and after as the manual's do / don't pair: the old value sits in a ruled box with an empty badge; the badge gets a cross and
// the box greys out; then the new value's box is ruled under it, its badge fills with the accent and gets a tick, and the new value
// slides in. The build grows below. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K, n = M.nextStep(clock), R = M.rig(W, T, K);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right, badge = 34, inner = 40;
  const tx0 = rtl ? x0 + inner + badge * 2 + 20 : x0 + inner, tx1 = rtl ? x1 - inner : x1 - inner - badge * 2 - 20;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: tx1 - tx0, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, minPx: 44, where: 'the compare label' }) : null;
  const yLabel = 450 + (label ? label.lead / 2 : 0);
  const boxH = (f) => f.height + 60;
  const A = { y0: 450 + (label ? label.height + 26 : 0) }; A.y1 = A.y0 + boxH(was);
  const B = { y0: A.y1 + 50 }; B.y1 = B.y0 + boxH(now);
  const yWas = A.y0 + 30 + was.lead / 2, yNow = B.y0 + 30 + now.lead / 2;
  const bxA = rtl ? x0 + inner / 2 + badge : x1 - inner / 2 - badge;
  const tA = at, tX = at + 0.85, tB = at + 1.15;
  const rule = (y0, y1, p, fill) => {
    if (p <= 0) return;
    ctx0.save(); ctx0.strokeStyle = K.ink; ctx0.lineWidth = 4; ctx0.fillStyle = fill; ctx0.beginPath(); ctx0.roundRect(x0, y0, x1 - x0, y1 - y0, 22); ctx0.fill();
    ctx0.setLineDash([2 * (x1 - x0 + y1 - y0) * M.E(p), 4000]); ctx0.stroke(); ctx0.restore();
  };
  let ctx0 = null;
  return {
    duration: d,
    draw(ctx, t) {
      ctx0 = ctx;
      ground.draw(ctx, t);
      M.stepNumber(ctx, kit, n, rtl ? x1 : x0, 330, T.size.step * 0.8, K.ink, (t - at) / 0.3, rtl);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: K.grey, each: (w, i, b, c) => M.arrive(c, (t - at - i * 0.06) / 0.3, rtl, label.size) });
      const grey = M.clamp((t - tX) / 0.25);
      rule(A.y0, A.y1, (t - tA) / 0.35, grey > 0 ? M.rgba(K.ink, 0.05 * grey) : K.paper);
      const ya = (A.y0 + A.y1) / 2;
      if (t >= tA + 0.2) { ctx.save(); ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.fillStyle = K.paper; ctx.beginPath(); ctx.arc(bxA, ya, badge, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const px = M.clamp((t - tX) / 0.25), q = badge * 0.45;
        ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
        if (px > 0) { const a = Math.min(1, px * 2), b = Math.max(0, px * 2 - 1); ctx.moveTo(bxA - q, ya - q); ctx.lineTo(bxA - q + 2 * q * a, ya - q + 2 * q * a); if (b > 0) { ctx.moveTo(bxA + q, ya - q); ctx.lineTo(bxA + q - 2 * q * b, ya - q + 2 * q * b); } }
        ctx.stroke(); ctx.restore(); }
      kit.drawText(ctx, was, { x0: tx0, x1: tx1, y: yWas, align: 'start', color: K.grey, key: K.grey, each: (w, i, b, c) => M.arrive(c, (t - tA - 0.15 - i * 0.06) / 0.3, rtl, was.size) });
      rule(B.y0, B.y1, (t - tB) / 0.35, K.paper);
      const yb = (B.y0 + B.y1) / 2, pb = M.clamp((t - tB - 0.25) / 0.3);
      if (pb > 0) { ctx.save(); ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(bxA, yb, badge * M.E(pb), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const pt = M.clamp((t - tB - 0.5) / 0.25), q = badge * 0.45;
        if (pt > 0) { ctx.strokeStyle = K.onAccent; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(bxA - q, yb);
          const m = [bxA - q * 0.25, yb + q * 0.7], e = [bxA + q, yb - q * 0.75];
          if (pt < 0.4) ctx.lineTo(M.lerp(bxA - q, m[0], pt / 0.4), M.lerp(yb, m[1], pt / 0.4)); else { ctx.lineTo(m[0], m[1]); ctx.lineTo(M.lerp(m[0], e[0], (pt - 0.4) / 0.6), M.lerp(m[1], e[1], (pt - 0.4) / 0.6)); }
          ctx.stroke(); }
        ctx.restore(); }
      kit.drawText(ctx, now, { x0: tx0, x1: tx1, y: yNow, align: 'start', color: K.ink, key: K.ink, each: (w, i, b, c) => M.arrive(c, (t - tB - 0.3 - i * 0.06) / 0.3, rtl, now.size) });
      R.draw(ctx, n, t, Math.max(at + 0.4, 0.25));
    },
  };
}
