// Before and after as two cards. The old value is on a pale card that pops on; a broken ink line is drawn through it. A curved arrow
// is drawn from it down to where the new card turns in on its axis, in held drawings: the accent card, the new value on it.
// The label pops on above. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, room: 0 });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: maxW - 220, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 40, minScale: 0.88, where: 'the compare label' }) : null;
  const yLabel = 300 + (label ? label.lead / 2 : 0), top = label ? 300 + label.height + 50 : 330;
  const cw = (f) => Math.max(f.width + 140, 380), chh = (f) => f.height + 70;
  const wW = cw(was), wH = chh(was), nW = cw(now), nH = chh(now);
  const yWas = top + wH / 2, yNow = yWas + wH / 2 + 150 + nH / 2;
  const wasCard = M.round(W / 2 - wW / 2, yWas - wH / 2, wW, wH, 28), nowCard = M.round(W / 2 - nW / 2, yNow - nH / 2, nW, nH, 28);
  const cutT = at + 0.85, nowT = at + 1.3;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) {
        ctx.save();
        if (M.grow(ctx, M.pop(t, at, T.dur.pop), W / 2, yLabel) !== false) kit.drawText(ctx, label, { x0: X0, x1: X1, y: yLabel, align: 'center', color: P.ink });
        ctx.restore();
      }
      ctx.save();
      if (M.grow(ctx, M.pop(t, at + 0.2, T.dur.pop), W / 2, yWas) !== false) {
        M.cel(ctx, wasCard, { fill: P.soft, line: P.ink, width: 4, id: 110, t, gaps: 0.16 });
        const gone = t >= cutT + 0.1;
        kit.drawText(ctx, was, { x0: X0, x1: X1, y: yWas - was.height / 2 + was.lead / 2, align: 'center', color: gone ? P.grey : P.ink, key: gone ? P.grey : P.ink });
        const pk = span(t, cutT, cutT + 0.25);
        if (pk > 0) {                                                   // the strike, drawn on in held steps
          const q = Math.ceil(pk * 4) / 4, s = new Path2D(), x0 = rtl ? W / 2 + wW / 2 + 10 : W / 2 - wW / 2 - 10, x1 = rtl ? W / 2 - wW / 2 - 10 : W / 2 + wW / 2 + 10;
          s.moveTo(x0, yWas + 8); s.lineTo(x0 + (x1 - x0) * q, yWas + 8 - 16 * q);
          M.cel(ctx, s, { line: P.ink, width: 9, id: 111, t, gaps: 0.06 });
        }
      }
      ctx.restore();
      const ax = rtl ? W / 2 + wW / 2 - 30 : W / 2 - wW / 2 + 30;
      M.arrow(ctx, ax, yWas + wH / 2 + 14, ax + (rtl ? 120 : -120), (yWas + yNow) / 2 + 20, rtl ? W / 2 + nW / 2 - 70 : W / 2 - nW / 2 + 70, yNow - nH / 2 - 16, span(t, cutT + 0.2, nowT), P.ink, t, 120);
      ctx.save();
      if (M.flip(ctx, t, nowT, null, W / 2, yNow) !== false) {
        M.cel(ctx, nowCard, { fill: P.accent, line: P.ink, width: 5, id: 112, t, gaps: 0.14 });
        kit.drawText(ctx, now, { x0: X0, x1: X1, y: yNow - now.height / 2 + now.lead / 2, align: 'center', color: P.onAccent, key: P.onAccent });
      }
      ctx.restore();
    },
  };
}
