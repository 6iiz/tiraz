// Before and after as a composition: the old value is set in a soft ink tint and slashed by a heavy mid-tone diagonal; a big ink
// triangle turns into place pointing down; the new value lands on an accent slab that runs the full width of the frame, set in the
// ink that reads on it. The label, when given, sits on a short ink slab. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, triangle, bar, circle } = await import(look.base + 'motion.js');
  const P = ground.P, dir = ground.dir, rtl = ground.rtl, sx = ground.sx;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 40;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const lsize = T.size.lead, lpad = lsize * T.bar.pad;
  const label = S.label ? kit.fit(S.label, { size: lsize, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const yLabel = 400, yWas = 560, wasBottom = yWas - was.lead / 2 + was.height, yTri = wasBottom + 110, yNow = yTri + 130 + now.lead / 2;
  const out0 = d - T.dur.out, cutT = at + 0.8, nowT = at + 1.25;
  const rise = (t, t0, size) => (w, i, box, c) => {
    if (arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size, dir) === false) return false;
    if (leave(c, span(t, out0, d), box, size, dir) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), gone = (p) => (out > 0 ? Math.max(0, p - out * 1.4) : p);
      circle(ctx, gone(span(t, at, at + T.dur.shape)), sx(150), 300, 90, P.mid, { x: 0, y: -500 });
      if (label) {
        const a = rtl ? SAFE.right - label.width - lpad : 0, b = rtl ? W : SAFE.left + label.width + lpad;
        ctx.save(); ctx.translate(-dir * W * out ** 2, 0); ground.slab(ctx, span(t, at, at + T.dur.in), a, b, yLabel, lsize * T.bar.h, P.ink); ctx.restore();
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: P.paper, each: rise(t, at + 0.12, label.size) });
      }
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start', color: P.soft, key: P.soft, each: rise(t, at + 0.2, was.size) });
      was.rows.forEach((row, r) => {
        const y = yWas + r * was.lead, xa = rtl ? SAFE.right + 20 : SAFE.left - 20, xb = rtl ? SAFE.right - row.width - 20 : SAFE.left + row.width + 20;
        bar(ctx, gone(span(t, cutT + r * 0.08, cutT + r * 0.08 + 0.3)), xa, y + was.size * 0.3, xb, y - was.size * 0.2, 16, P.mid);
      });
      triangle(ctx, gone(span(t, cutT + 0.1, cutT + 0.1 + T.dur.shape)), W / 2, yTri, 170, P.ink, { x: 0, y: -160 }, Math.PI);
      const bh = now.height + now.size * 0.5, cy = yNow - now.lead / 2 + now.height / 2;
      ctx.save(); ctx.translate(-dir * W * out ** 2, 0); ground.slab(ctx, span(t, nowT, nowT + T.dur.in), 0, W, cy, bh, P.accent); ctx.restore();
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow, align: 'start', color: P.on, key: P.on, each: rise(t, nowT + 0.15, now.size) });
    },
  };
}
