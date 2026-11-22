// Before and after as two panels. The old value arrives on the first surface; when the new one comes it steps back (it dims and
// shrinks a little, like a slide moving behind the next), a round button with a chevron sits between them, and the new value snaps
// up on the second surface with an accent border while the light sweeps across it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, rtl = kit.rtl, L = SAFE.left, R = SAFE.right, inner = 48;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: R - L - 2 * inner, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead + 6, weight: 600, maxW: R - L, single: true, where: 'the compare label' }) : null;
  const hW = was.height + 70, hN = now.height + 70, btn = 72;
  const yLabel = 440, yW = 510, yB = yW + hW + 30, yN = yB + btn + 30;
  const out0 = d - T.dur.out, nowT = at + 1.2;
  const wasDim = mix(pal.light, pal.dark, 0.35);
  const words = (t, t0, size, out) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size) === false) return false;
    if (M.leave(c, out, box, size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), fade = 1 - M.S(out), back = M.E(span(t, nowT - 0.1, nowT + 0.4));
      if (label) kit.drawText(ctx, label, { x0: L, x1: R, y: yLabel, align: 'start', color: pal.dim, each: words(t, at, label.size, out) });
      // the old value steps back
      ctx.save(); ctx.globalAlpha = fade;
      const cx = W / 2, cy = yW + hW / 2, s = 1 - 0.05 * back;
      ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
      M.card(ctx, L, yW, R - L, hW, T.radius.card, pal.s1, pal.border, span(t, at, at + T.dur.in));
      kit.drawText(ctx, was, { x0: L + inner, x1: R - inner, y: yW + 35 + was.lead / 2, align: 'start', color: mix(pal.light, wasDim, back), key: mix(pal.light, wasDim, back),
        each: words(t, at + 0.1, was.size, out) });
      ctx.restore();
      // the button between them
      const pb = span(t, nowT - 0.3, nowT);
      if (pb > 0) {
        ctx.save(); ctx.globalAlpha = M.E(pb) * fade; const bx = W / 2, by = yB + btn / 2;
        ctx.fillStyle = pal.s2; ctx.beginPath(); ctx.arc(bx, by, btn / 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pal.border; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = pal.light; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const dy = (1 - M.E(pb)) * -8; ctx.beginPath(); ctx.moveTo(bx - 13, by - 5 + dy); ctx.lineTo(bx, by + 8 + dy); ctx.lineTo(bx + 13, by - 5 + dy); ctx.stroke();
        ctx.restore();
      }
      // the new value
      const pn = span(t, nowT, nowT + T.dur.in);
      if (pn > 0) {
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(0, (1 - M.E(pn)) * 30);
        M.card(ctx, L, yN, R - L, hN, T.radius.card, pal.s2, rgba(pal.accent, 0.75), pn);
        M.sheen(ctx, L, yN, R - L, hN, T.radius.card, span(t, nowT + 0.15, nowT + 0.15 + T.dur.sweep), pal.light, rtl, 1.3);
        ctx.restore();
      }
      kit.drawText(ctx, now, { x0: L + inner, x1: R - inner, y: yN + 35 + now.lead / 2, align: 'start', color: pal.keyOn(pal.s2), key: pal.keyOn(pal.s2),
        each: words(t, nowT + 0.05, now.size, out) });
    },
  };
}
