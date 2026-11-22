// A number as a measured layer: the projector raises a level of accent light up every facade of the model while the figure in the
// readout climbs with it (one value per step, the steps shrinking as it lands); when the figure lands the level has passed the roofs it
// reaches and they light. The label is switched on under a hairline. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, rgba, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const label = kit.fit(S.label, { size: T.size.label, weight: 500, maxW, minScale: 1, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 600, 1) > maxW && size > 120) size -= 8;
  const yChip = 360, yNum = yChip + 40 + size * 0.55, yRule = yNum + size * 0.55, yLabel = yRule + 30 + label.lead / 2;
  const maxH = Math.max(...ground.B.map((b) => b.h)), land = at + 1.5;
  const steps = (p) => { const k = 20, i = Math.floor((1 - (1 - Math.min(1, p)) ** 2) * k); return p >= 1 ? 1 : i / k; };
  return {
    duration: d,
    draw(ctx, t) {
      const p = span(t, at + 0.1, land), q = steps(p);
      ground.draw(ctx, t, { level: { h: maxH * 0.75 * M.soft(p) + 0.01, col: pal.accent, w: M.E(span(t, at, at + 0.3)) } });
      const cp = M.E(span(t, at, at + 0.3));
      if (cp > 0) { ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? x1 - 16 : x0, yChip - 8, 16, 16); ctx.fillStyle = rgba(pal.light, 0.35); const rw = 220 * cp; ctx.fillRect(rtl ? x1 - 28 - rw : x0 + 28, yChip - 0.5, rw, 1.5); }
      if (p > 0) {
        ctx.save(); ctx.shadowColor = rgba(pal.accent, 0.35); ctx.shadowBlur = 30;
        kit.number(ctx, text(countValue(0, S.value, q, (x) => x)), { x: rtl ? x1 : x0, y: yNum, size, weight: 600, color: pal.light, align: rtl ? 'right' : 'left', settle: q });
        ctx.restore();
      }
      const rp = M.E(span(t, land - 0.2, land + 0.2)), rw = maxW * rp;
      ctx.fillStyle = rgba(pal.light, 0.5); ctx.fillRect(rtl ? x1 - rw : x0, yRule, rw, 1.5);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey, key: pal.key,
        each: (w, i, box, c) => M.strike(c, span(t, at + 0.5 + i * T.dur.step, at + 0.5 + i * T.dur.step + T.dur.strike), 0, w.key ? pal.key : pal.grey, pal.dark, label.size, w.key ? rgba(pal.accent, 0.6) : null) });
    },
  };
}
