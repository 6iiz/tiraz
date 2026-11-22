// Before and after: the old value pops in on a pale ticket, then a thick squiggle is scribbled through it from the reading side and the
// ticket fades back; the new value pops in below on an accent sticker with a hard dotted shadow, tilting a little more as it lands.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, Z = T.zone, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: 700, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minPx: 44, where: 'the compare label' }) : null;
  const cx = W / 2, yLabel = Z.top + 10, yWas = yLabel + (label ? label.height / 2 : 0) + 110, yNow = yWas + 200;
  const half = (f) => Math.max(140, f.width / 2 + f.size * 0.55), hw = half(was), hn = half(now);
  const soft = mix(P.ink, P.paper, 0.3), cutT = at + 0.85, nowT = at + 1.35;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      M.marksRow(ctx, P, t, at, rtl ? SAFE.right : SAFE.left, Z.marks, rtl, out);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: soft,
        each: (w, i, box, c) => { const t0 = at + i * 0.05; if (M.pop(c, span(t, t0, t0 + T.dur.in), box.x + box.width / 2, box.y) === false) return false; if (M.leave(c, out, box.x + box.width / 2, box.y) === false) return false; } });
      const pw = span(t, at + 0.15, at + 0.15 + T.dur.in);
      if (pw > 0 && out < 1) {
        const fade = span(t, cutT + 0.3, cutT + 0.6);
        ctx.save(); M.pop(ctx, pw, cx, yWas, -5); M.leave(ctx, out, cx, yWas);
        ctx.globalAlpha *= 1 - 0.45 * fade;
        M.sticker(ctx, P, cx - hw, cx + hw, yWas - was.size * 0.72, yWas + was.size * 0.72, P.ticketB, { off: 7, r: 20 });
        kit.drawText(ctx, was, { x0: cx - hw, x1: cx + hw, y: yWas, align: 'center', color: P.ink, key: P.ink });
        ctx.globalAlpha = 1;
        M.squiggle(ctx, cx - hw - 16, cx + hw + 16, yWas, span(t, cutT, cutT + 0.35), P.accent, 9, 10, rtl);
        ctx.restore();
      }
      const pn = span(t, nowT, nowT + T.dur.in);
      if (pn > 0 && out < 1) {
        ctx.save(); M.pop(ctx, pn, cx, yNow, 9); M.leave(ctx, out, cx, yNow);
        M.sticker(ctx, P, cx - hn, cx + hn, yNow - now.size * 0.72, yNow + now.size * 0.72, P.accent, { off: 11 });
        kit.drawText(ctx, now, { x0: cx - hn, x1: cx + hn, y: yNow, align: 'center', color: P.onAccent, key: P.onAccent });
        ctx.restore();
      }
    },
  };
}
