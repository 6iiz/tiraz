// Before and after, printed: the old value in a soft ink tint is struck through by a rough bar of the accent drum; a printed arrow
// points down; the new value lands on a full accent patch, set in the ink that reads on it, with the arrow's halftone shadow off register.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, feed, blob, overprint, E } = await import(look.base + 'motion.js');
  const P = ground.P, reg = ground.reg, maxW = SAFE.right - SAFE.left - 80;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead + 4, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const yLabel = 400, yWas = 560 + (was.rows.length - 1) * was.lead * 0.5, yArrow = yWas - was.lead / 2 + was.height + 10, yNow = yArrow + 220 + now.lead / 2;
  const out0 = d - T.dur.out, cutT = at + 0.85, nowT = at + 1.3;
  const rise = (t, t0, size) => (w, i, box, c) => {
    if (arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size) === false) return false;
    if (leave(c, span(t, out0, d), box, size) === false) return false;
  };
  const arrow = (c, x, y, fill) => {
    c.beginPath(); c.moveTo(x - 34, y); c.lineTo(x + 34, y); c.lineTo(x + 34, y + 90); c.lineTo(x + 86, y + 90); c.lineTo(x, y + 170);
    c.lineTo(x - 86, y + 90); c.lineTo(x - 34, y + 90); c.closePath(); c.fillStyle = fill; c.fill();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.soft, each: rise(t, at, label.size) });
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, color: P.soft, key: P.soft, each: rise(t, at + 0.15, was.size) });
      // the strike: one rough accent bar per row of the old value, pulled across from the reading side
      const sp = E(span(t, cutT, cutT + 0.35)) * (1 - E(out));
      if (sp > 0) was.rows.forEach((row, r) => {
        const w = (row.width + 50) * sp, x0 = W / 2 - (row.width + 50) / 2, x = kit.rtl ? x0 + row.width + 50 - w : x0;
        overprint(ctx, reg, () => blob(ctx, x, yWas + r * was.lead - was.size * 0.09, w, was.size * 0.18, 91 + r, P.accent));
      });
      ctx.save();
      if (feed(ctx, span(t, cutT + 0.1, cutT + 0.45), out, 0, yArrow - 10, W, 200) !== false) {
        ctx.save(); ctx.translate(14, 12); arrow(ctx, W / 2, yArrow, ground.screen(ctx, 'ink')); ctx.restore();
        overprint(ctx, reg, () => arrow(ctx, W / 2, yArrow, P.accent));
      }
      ctx.restore();
      ctx.save();
      const pad = now.size * 0.3, hh = now.height + pad * 0.6;
      if (feed(ctx, span(t, nowT, nowT + 0.4), out, 0, yNow - now.lead / 2 - pad, W, hh + 2 * pad) !== false)
        overprint(ctx, reg, () => blob(ctx, W / 2 - now.width / 2 - pad * 1.6, yNow - now.lead / 2 - pad * 0.3, now.width + pad * 3.2, hh, 97, P.accent));
      ctx.restore();
      ground.wear(ctx);
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow, color: P.on, key: P.on, each: rise(t, nowT + 0.15, now.size) });
    },
  };
}
