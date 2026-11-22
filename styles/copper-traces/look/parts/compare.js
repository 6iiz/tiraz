// Before and after as a rerouted circuit. The old value is printed on a chip fed by a trace from the reading side's edge, through a
// fuse. It powers up, then the fuse blows: the copper opens with a scorch, the old chip goes dark and a silkscreen line strikes its
// word. The current takes the branch that turns down at 45 degrees and reaches the second chip, where the new value is set on an
// exposed gold pad that lights. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X = (x) => (rtl ? x : W - x);                                   // drawn for right to left, mirrored for left to right
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const cA = Math.min(X(SAFE.left + 30), X(SAFE.right - 130)), cB = Math.max(X(SAFE.left + 30), X(SAFE.right - 130));
  const inner = cB - cA - 100;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: inner, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 20, single: true, where: 'the compare label' }) : null;
  const bh = Math.max(was.height, now.height) + 70, gap = 130, lh = label ? label.lead + 50 : 0;
  const top = kit.place(lh + bh * 2 + gap, 700), yLabel = top + (label ? label.lead / 2 : 0);
  const yA = top + lh + bh / 2, yB = yA + bh + gap;
  const end = rtl ? cB : cA, xj = X(1046), xf = X(1000);
  const feed = M.route([[X(W + 20), yA], [end, yA]]);
  const branch = M.route([[xj, yA], [xj, yB - 50], [X(996), yB], [end, yB]]);
  const fuseAt = Math.abs(xf - feed.pts[0][0]);
  const cutT = at + 0.95, nowT = at + 1.45, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, out0, d)); if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -36 * o);
      M.field(ctx, SAFE.left - 54, top - 30, SAFE.right + 54, yB + bh / 2 + 40, P);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: P.dim,
        each: (w, i, box, c) => M.power(c, t, at - 0.1 + i * 0.05, T.dur.in, box, label.size, P) });
      // copper: the feed (opened at the fuse once it blows) and the branch
      const blown = t >= cutT;
      M.trace(ctx, feed, P, 10);
      M.trace(ctx, branch, P, 10, 0, Infinity, false);
      if (blown) {                                                       // the open: bare mask and a scorch
        ctx.fillStyle = P.mask; ctx.fillRect(xf - 16, yA - 14, 32, 28);
        const s = 1 - span(t, cutT, cutT + 0.5);
        M.halo(ctx, xf - 50, yA - 50, 100, 100, P, 0.9 * s);
        ctx.fillStyle = rgba(P.dark, 0.7); ctx.beginPath(); ctx.ellipse(xf, yA, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = P.dim; ctx.lineWidth = 2; ctx.strokeRect(xf - 26, yA - 20, 52, 40);   // the fuse outline
      // current: in along the feed to the first chip, then (after the fuse) down the branch
      const pIn = M.Q(span(t, at, at + 0.3));
      if (pIn > 0) M.glow(ctx, feed, P, 0, blown ? Math.min(fuseAt - 20, feed.total * pIn) : feed.total * pIn, 10, blown ? 0.6 : (pIn < 1 ? 1 : 0.45));
      const pB = M.Q(span(t, cutT + 0.1, nowT));
      if (pB > 0) M.glow(ctx, branch, P, pB < 1 ? branch.total * pB - 160 : 0, branch.total * pB, 10, pB < 1 ? 1 : 0.45);
      // the two chips
      for (const y of [yA, yB]) M.chip(ctx, cA, y - bh / 2, cB, y + bh / 2, P, rtl);
      const ink = mix(P.dim, P.mask, 0.25 * span(t, cutT, cutT + 0.2));
      kit.drawText(ctx, was, { x0: cA + 50, x1: cB - 50, y: yA - was.height / 2 + was.lead / 2, color: blown ? ink : P.silk, key: blown ? ink : P.silk,
        each: (w, i, box, c) => M.power(c, t, at + 0.3 + i * 0.05, T.dur.in, box, was.size, P) });
      const ps = span(t, cutT + 0.05, cutT + 0.25);
      if (ps > 0) { const L = (was.width + 40) * ps, xm = (cA + cB) / 2; ctx.fillStyle = P.silk; ctx.fillRect(rtl ? xm + was.width / 2 + 20 - L : xm - was.width / 2 - 20, yA - 3, L, 6); }
      const pg = span(t, nowT, nowT + 0.22);
      if (pg > 0) {
        const w = now.width + 70, h = now.height + 28, e = M.E(pg);
        ctx.save(); ctx.translate((cA + cB) / 2, yB); ctx.scale(0.88 + 0.12 * e, 0.88 + 0.12 * e); ctx.globalAlpha *= Math.min(1, pg * 3);
        M.pad(ctx, -w / 2, -h / 2, w, h, 12, P, 0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, pg * 1.4))); ctx.restore();
      }
      kit.drawText(ctx, now, { x0: cA + 50, x1: cB - 50, y: yB - now.height / 2 + now.lead / 2, color: pg > 0 ? P.onGold : P.silk, key: pg > 0 ? P.onGold : P.silk,
        each: (w, i, box, c) => M.power(c, t, nowT + 0.02, T.dur.in, box, now.size, P, 0, nowT - 0.5) });
      ctx.restore();
    },
  };
}
