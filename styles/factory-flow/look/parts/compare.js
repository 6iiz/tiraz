// Before and after as a machine in the line. The old value sits in the upper room; at the cut it is rejected: the room's light goes
// off, the word greys and a bar is struck across it. A crate leaves through the floor, drops down the pipe through a machine whose
// gears turn while it passes, and lands in the lower room, which lights; the new value rides in and the press stamps it with the
// accent label. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const rx0 = SAFE.left - 6, rx1 = SAFE.right + 6, cx = W / 2;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: rx1 - rx0 - 120, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 140, single: true, where: 'the compare label' }) : null;
  const lh = label ? label.lead + 30 + 36 : 0, hA = was.height + 70, hB = now.height + 70, gap = 240;
  const top = kit.place(lh + hA + gap + hB, 760), yPl = top + (label ? (label.lead + 30) / 2 : 0);
  const a0 = top + lh, a1 = a0 + hA, b0 = a1 + gap, b1 = b0 + hB, mY = (a1 + b0) / 2;
  const cutT = at + 0.95, nowT = at + 1.45, stampT = nowT + 0.45, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), o = M.I(out), rejected = t >= cutT;
      M.pipe(ctx, [[cx, a1], [cx, b0]], P, 40);
      const fall = span(t, cutT + 0.05, nowT);
      if (fall > 0 && fall < 1) M.crate(ctx, cx, a1 + (b0 - a1) * M.G(fall), 44, P);
      // the machine on the pipe
      M.shape(ctx, M.rectPath(cx - 150, mY - 50, 300, 100, 10), P.steel, P, 6, 10);
      const turn = 6 * span(t, cutT, nowT + 0.2);
      M.gear(ctx, cx + (rtl ? 90 : -90), mY, 40, turn, P.crate, P, 9); M.gear(ctx, cx + (rtl ? 20 : -20), mY, 26, -turn * 1.5 + 0.3, P.plaque, P, 7);
      ctx.fillStyle = P.accent; ctx.fillRect(rtl ? cx - 130 : cx + 70, mY - 12, 60, 24);
      const litA = span(t, at - 0.3, at) * (1 - span(t, cutT, cutT + 0.15));
      M.room(ctx, rx0, a0, rx1, a1, P, litA);
      const litB = span(t, nowT, nowT + 0.12) * (1 - span(t, out0, out0 + 0.15));
      M.room(ctx, rx0, b0, rx1, b1, P, litB);
      if (label) {
        const pw = label.width + 70, p1 = rtl ? SAFE.right : SAFE.left + pw, p0 = p1 - pw, drop = M.E(span(t, at - 0.5, at - 0.2));
        if (drop > 0) { ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, (1 - drop) * -40); M.plaque(ctx, p0, yPl - label.lead / 2 - 15, p1, yPl + label.lead / 2 + 15, P); kit.drawText(ctx, label, { x0: p0 + 35, x1: p1 - 35, y: yPl, color: P.onPlaque }); ctx.restore(); }
      }
      const grey = rejected ? P.dim : P.light;
      kit.drawText(ctx, was, { x0: rx0 + 40, x1: rx1 - 40, y: a0 + 35 + was.lead / 2, color: grey, key: grey,
        each: (w, i, box, c) => M.ride(c, span(t, at + 0.05 + i * T.dur.step, at + 0.05 + i * T.dur.step + T.dur.in), box, was.size, rtl, T.dur.run, rx0, rx1, out) });
      const ps = M.E(span(t, cutT, cutT + 0.18));
      if (ps > 0 && out < 1) { const L = (was.width + 50) * ps, y = a0 + 35 + was.lead / 2; ctx.save(); ctx.globalAlpha = 1 - o; M.shape(ctx, M.rectPath(rtl ? cx + was.width / 2 + 25 - L : cx - was.width / 2 - 25, y - 7, L, 14, 3), P.accent, P, 3, 0); ctx.restore(); }
      const yN = b0 + 35 + now.lead / 2;
      if (t >= stampT && out < 1) { ctx.save(); ctx.translate(o * (rtl ? -1 : 1) * T.dur.run * 1.6, 0); ctx.beginPath(); ctx.rect(rx0, b0, rx1 - rx0, b1 - b0); ctx.clip(); M.label(ctx, { x: cx - now.width / 2, y: yN, width: now.width }, now.size, P, span(t, stampT, stampT + 0.25)); ctx.restore(); }
      kit.drawText(ctx, now, { x0: rx0 + 40, x1: rx1 - 40, y: yN, color: t >= stampT ? P.onAccent : P.light, key: t >= stampT ? P.onAccent : P.light,
        each: (w, i, box, c) => M.ride(c, span(t, nowT + 0.02 + i * T.dur.step, nowT + 0.02 + i * T.dur.step + T.dur.in), box, now.size, rtl, T.dur.run, rx0, rx1, out) });
      M.press(ctx, cx, b0, yN - now.size * 0.66, now.width + 50, span(t, stampT - 0.22, stampT + 0.22), P);
    },
  };
}
