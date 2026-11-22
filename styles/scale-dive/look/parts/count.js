// A number: the camera dives faster while a giant numeral grows out of the distance and counts up to its value; a ring of the pointer
// colour with four sight marks closes in on it and locks on as the count lands, over two hard glow rings. The label sits under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 760 && size > 120) size -= 8;
  const nw = kit.numberWidth(text(S.value), size, 900, 1);
  const cx = W / 2, cy = 590, R = Math.min(440, Math.max(nw / 2 + 60, size * 0.62));
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minPx: 44, where: 'the count label' });
  const yLabel = Math.min(cy + R + 40 + label.lead / 2, SAFE.bottom - label.height + label.lead / 2);
  const tLand = at + 1.4;
  return {
    duration: d,
    draw(ctx, t) {
      const pc = span(t, at, tLand);
      ground.draw(ctx, t, 0.8 * ease.inOutCubic(pc));
      ctx.save();
      if (M.rushOut(ctx, span(t, d - T.dur.out, d), cx, cy)) {
        const g = M.Q(span(t, at, at + 0.5));
        if (g > 0) { ctx.save(); ctx.translate(cx, cy); ctx.scale(g, g); M.glow(ctx, 0, 0, R * 0.78, pal, 0.3); ctx.restore(); }
        // the lock-on ring closes from far out and stops on the landing
        const lk = M.Q(span(t, at + 0.2, tLand)), rr = M.logLerp(R * 2.6, R, lk);
        if (lk > 0) {
          M.ring(ctx, cx, cy, rr, pal.sun, 4);
          M.ring(ctx, cx, cy, rr + 18, pal.sun, 3, [2, 14], -(t + clock) * 20);
          ctx.fillStyle = pal.sun;
          for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + (1 - lk) * 0.8; ctx.save(); ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); ctx.rotate(a); ctx.fillRect(-26, -3, 30, 6); ctx.restore(); }
        }
        // the numeral grows out of the distance while it counts
        const s = M.logLerp(0.2, 1, M.Q(span(t, at, at + 0.9)));
        if (t >= at) {
          ctx.save(); ctx.globalAlpha *= Math.min(1, (t - at) * 6); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
          kit.number(ctx, text(countValue(0, S.value, pc)), { x: cx, y: cy, size, color: pal.ink, align: 'center', settle: pc });
          ctx.restore();
        }
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: pal.ink, key: pal.sun,
          each: (w, i, box, c) => { const t0 = at + 0.9 + i * 0.06; if (M.arrive(c, span(t, t0, t0 + T.dur.in), box, cx, cy) === false) return false; } });
      }
      ctx.restore();
    },
  };
}
