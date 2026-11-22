// A number on a rooftop: the roof rises in time-lapse steps, a giant numeral is painted on it and counts up in the camera's stutter
// (twelve values a second, like a scoreboard filmed in time-lapse), with a painted accent stripe under it that grows with the count.
// The label is set down under it, a key phrase on a tarp. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 800 && size > 120) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 72, minPx: 44, where: 'the count label' });
  const block = size * 1.05 + 40 + label.height, pad = 54, top = kit.place(block, 690);
  const yNum = top + size * 0.52, yStripe = top + size * 1.05, yLabel = yStripe + 40 + label.lead / 2;
  const roof = { x: 44, y: top - pad, w: W - 88, h: block + pad * 2 }, band = { y: roof.y + roof.h / 2 - 13, h: roof.h + 30 };
  const x0 = SAFE.left + 36, x1 = SAFE.right - 36;
  const runs = M.keyRuns(label, { x0, x1, y: yLabel, align: 'center' }, rtl);
  const c0 = at + 0.3, c1 = at + 1.6;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, band);
      const tl = M.lapse(t);
      ctx.save();
      if (M.slab(ctx, roof, pal, (tl - at) / 0.24)) {
        const p = span(tl, c0, c1);
        if (tl >= c0) kit.number(ctx, text(countValue(0, S.value, p, ease.outQuart)), { x: W / 2, y: yNum, size, color: pal.ink, align: 'center', settle: p });
        const sw = (x1 - x0) * ease.outQuart(p);
        if (sw > 0) { ctx.fillStyle = pal.tarpEdge; ctx.fillRect(W / 2 - sw / 2 - 3, yStripe - 3, sw + 6, 20); ctx.fillStyle = pal.accent; ctx.fillRect(W / 2 - sw / 2, yStripe, sw, 14); }
        for (const r of runs) { const s = c1 - 0.3 + r.first * 0.08; M.tarp(ctx, r, label.size, (tl - s) / 0.2, pal, rtl); }
        kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: pal.ink, key: pal.onAccent, each: (w, i, box, c) => M.setDown(c, t, c1 - 0.3 + i * 0.08, box) });
      }
      ctx.restore();
    },
  };
}
