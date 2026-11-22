// Before and after as two light layers on the same table: the old value comes up in grey while the low buildings take a pale "before"
// light; then a projected hairline strikes the old value, it dims, and a sweep of accent light crosses the table and recolours the
// whole model as the new value comes up in the accent with the projected glow. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rgba, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0, MW = T.model.cols * T.model.cell;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 700, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 1, where: 'the compare label' }) : null;
  const yLabel = 400, yWas = yLabel + (label ? label.height : 0) + 10 + was.lead / 2, yNow = yWas + was.height + 40;
  const ww = M.layout(kit, was, { x0, x1, y: yWas }), wa = Math.min(...ww.map((w) => w.x)), wb = Math.max(...ww.map((w) => w.x + w.width));
  const cutT = at + 0.95, nowT = at + 1.35;
  const before = mix(pal.dark, pal.light, 0.75);
  const sw = (t, t0, size, col, glow) => (w, i, box, c) => M.strike(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.strike), 0, col, pal.dark, size, glow);
  return {
    duration: d,
    draw(ctx, t) {
      const front = M.E(span(t, nowT - 0.1, nowT + 0.6)) * (MW + 2) - 1, pb = span(t, at + 0.2, at + 0.35);
      ground.draw(ctx, t, { lit: (b) => {
        const reached = rtl ? b.cx > MW - front : b.cx < front;
        if (reached) return [pal.accent, 0.7];
        return b.h < 1 && pb > 0 ? [before, (pb < 0.5 ? 0.2 : 0.45) * (1 - 0.4 * span(t, cutT, cutT + 0.3))] : null;
      } });
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey, key: pal.key, each: sw(t, at, label.size, pal.grey, null) });
      const dim = M.E(span(t, cutT + 0.1, cutT + 0.4));
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: pal.grey, key: pal.grey, each: sw(t, at + 0.2, was.size, mix(pal.grey, pal.dark, dim * 0.45), null) });
      const sp = M.E(span(t, cutT, cutT + 0.2));
      if (sp > 0) { const len = (wb - wa + 40) * sp; ctx.fillStyle = rgba(pal.light, 0.8); ctx.fillRect(rtl ? wb + 20 - len : wa - 20, yWas - 1, len, 2.5); }
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.key, key: pal.key, each: sw(t, nowT, now.size, pal.key, rgba(pal.accent, 0.6)) });
    },
  };
}
