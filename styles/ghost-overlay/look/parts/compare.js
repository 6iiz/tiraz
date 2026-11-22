// Before and after as two exposures. The old value registers in, then loses register for good: it splits into two faint copies that
// drift apart, and a thin ink line crosses it. The new value then slides into register below it, its letters a window holding the
// deep landscape, with a lamp rule under it. A stag's head, turned the other way, keeps the scene's large window at the bottom.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, dir = rtl ? 1 : -1;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v).replace(/\*/g, '')) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const [was, now] = kit.fitAll([asText(S.was), '*' + asText(S.now) + '*'], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.92, where: 'the compare label' }) : null;
  const yLabel = 430, yWas = 430 + (label ? label.height : 0) + 60 + was.lead / 2, yNow = yWas + was.height + 70;
  const posWas = { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start' }, posNow = { x0: SAFE.left, x1: SAFE.right, y: yNow, align: 'start' };
  const K = M.keys(kit, now, posNow, P, T, dir);
  const tex = M.landscape(W + 320, 1000, P, 12);
  const cutT = at + 0.95, nowT = at + 1.35;
  let curT = 0;
  return {
    duration: d,
    draw(ctx, t) {
      curT = t; ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d);
      ctx.save(); ctx.globalAlpha = 1 - M.I(out);
      M.window(ctx, M.stag(0.03 * Math.sin(time * 1.1 + 1)), { x: W * 0.5 - T.drift.shape * t * dir, y: Math.max(1500, yNow + now.height + 560), s: 0.86, flip: rtl ? -1 : 1 }, tex,
        -160 - T.drift.inside * t * dir, 1000, P, span(t, at, at + T.dur.rise));
      ctx.restore();
      if (label) M.twice(kit, ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel + label.lead / 2, align: 'start' }, {
        shift: T.ghost.shift * 0.6, ghostA: T.ghost.alpha, dir, color: P.grey, ghostColor: P.grey, when: (i) => [span(curT, at + i * 0.05, at + i * 0.05 + T.dur.in), out] });
      // the old value: in register until the cut, then two drifting ghosts
      const c = M.E(span(t, cutT, cutT + 0.6));
      if (c <= 0) M.twice(kit, ctx, was, posWas, { shift: T.ghost.shift, ghostA: T.ghost.alpha, dir, color: P.ink, ghostColor: P.ink,
        when: (i) => [span(curT, at + 0.15 + i * 0.05, at + 0.15 + i * 0.05 + T.dur.in), out] });
      else {
        const g = c * 18, fade = 1 - M.I(out);
        for (const [dx, dy, a, rec] of [[-g * dir, -g * 0.4, 1 - 0.5 * c, true], [g * dir * 0.6, g * 0.3, 0.4 * c, false]]) {
          ctx.save(); ctx.translate(dx, dy); ctx.globalAlpha = a * fade;
          kit.drawText(ctx, was, { ...posWas, color: P.ink, key: P.ink, decor: !rec }); ctx.restore();
        }
        const lw = was.width * M.E(span(t, cutT, cutT + 0.35)) * fade, lx = rtl ? SAFE.right - lw : SAFE.left;
        ctx.fillStyle = P.ink; for (let r = 0; r < was.rows.length; r++) ctx.fillRect(lx, yWas + r * was.lead - 2, lw, 4);
      }
      M.twice(kit, ctx, now, posNow, { shift: T.ghost.shift * 1.3, ghostA: T.ghost.alpha, dir, color: P.ink, ghostColor: P.ink, style: K.style(t),
        when: (i) => [span(curT, nowT + i * 0.05, nowT + i * 0.05 + T.dur.in), out] });
      K.rule(ctx, span(t, nowT + 0.35, nowT + 0.7) * (1 - out));
    },
  };
}
