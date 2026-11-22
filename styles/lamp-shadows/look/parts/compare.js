// Before and after: the old value is a hard shadow on the cloth; then its rod pulls it back toward the lamp, so it swells into a soft
// ghost that stays faintly behind; the new value is pressed onto a carved plaque of dyed hide in its place below, and the rod taps it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, dir = rtl ? 1 : -1;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right, maxW = 760;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, minScale: 0.8, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0 - 40, minScale: 0.9, where: 'the compare label' }) : null;
  const lh = label ? label.height + 50 : 0, gapV = Math.max(now.size * 2.1, 200);
  const top = kit.place(lh + was.height + gapV, 700);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lh + was.lead / 2, yNow = yWas + gapV;
  const pullT = at + 0.95, nowT = at + 1.3, pr = T.dur.press;
  const pl = M.runPlaque({ x0: 0, x1: now.width }, now.size, P, 81);
  const out = (t) => span(t, d - T.dur.out, d);
  const pressEach = (t, t0, o, extra) => (w, i, box, c) => {
    const s0 = t0 + i * 0.06, mx = box.x + box.width / 2;
    if (M.press(c, span(t, s0, s0 + pr), mx, box.y, dir) === false) return false;
    if (M.lift(c, o, mx, box.y) === false) return false;
    if (extra) extra(c);
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = out(t);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: P.soft, each: pressEach(t, at, o) });
      // the old value: hard, then pulled back to a soft ghost (it keeps a faint presence: the past is still there, out of focus)
      const q = M.O(span(t, pullT, pullT + 0.45));
      ctx.save();
      if (q > 0) { const s = 1 + q * 0.12; ctx.translate(W / 2, yWas - q * 10); ctx.scale(s, s); ctx.translate(-W / 2, -yWas); ctx.globalAlpha = 1 - q * 0.62; ctx.filter = `blur(${(q * 4.5).toFixed(1)}px)`; }
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'center', color: P.ink, key: P.ink, each: pressEach(t, at + 0.15, o) });
      ctx.restore();
      ctx.save();
      if (M.press(ctx, span(t, nowT, nowT + pr), W / 2, yNow, dir) !== false && M.lift(ctx, o, W / 2, yNow) !== false) {
        ctx.translate(0, M.bob(t, nowT + pr, 4));
        M.rod(ctx, W / 2 + (pl.w / 2 - 50) * (rtl ? -1 : 1), yNow + now.size * 0.6, rtl ? -60 : 60, 220, P);
        M.lay(ctx, pl, W / 2, yNow);
      }
      ctx.restore();
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'center', color: P.ink, key: P.ink, each: pressEach(t, nowT, o, (c) => c.translate(0, M.bob(t, nowT + pr, 4))) });
    },
  };
}
