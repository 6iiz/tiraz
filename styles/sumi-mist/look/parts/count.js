// A number in one breath: a single circle is brushed round the centre of the paper, its tail running dry and leaving the circle open;
// the figure blooms inside it and climbs to its value, and when it lands the red seal is pressed in the circle's opening. The label
// blooms word by word under it. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > 640 && size > 110) size -= 8;
  const numW = kit.numberWidth(text(S.value), size, 800, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 60, minScale: 0.8, where: 'the count label' });
  const R = Math.min(400, Math.max(size * 0.68, numW / 2 + 70));
  const top = kit.place(R * 2 + 70 + label.height, 680), cx = W / 2, cy = top + R;
  const yLabel = cy + R + 70 + label.lead / 2;
  const a0 = rtl ? -0.75 * Math.PI : -0.25 * Math.PI, dir = rtl ? -1 : 1;
  const ring = M.enso(cx, cy, R, { a0, dir, w: Math.max(26, R * 0.12), sweep: 0.88 });
  // the opening of the circle, where the seal goes: a little past the dry tail
  const aGap = a0 + dir * 0.94 * Math.PI * 2, gx = cx + Math.cos(aGap) * R, gy = cy + Math.sin(aGap) * R;
  const tLand = at + 1.45;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), fade = 1 - M.I(out);
      M.paint(ctx, ring, M.B(span(t, at, at + 0.9)), pal.quiet(T.tone.nong), fade);
      const p = span(t, at + 0.25, tLand), pb = M.E(span(t, at + 0.25, at + 0.85));
      if (pb > 0 && fade > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, pb * 1.2) * fade;
        const blur = size * 0.25 * (1 - pb) + size * 0.2 * M.I(out);
        if (blur > 0.5) { ctx.shadowColor = pal.rgba(pal.ink, 0.6); ctx.shadowBlur = blur; }
        kit.number(ctx, text(countValue(0, S.value, p, M.E)), { x: cx, y: cy + size * 0.04, size, weight: 800, color: pal.ink, settle: p });
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = fade; M.seal(ctx, gx, gy, T.size.seal * 1.4, pal, span(t, tLand, tLand + 0.2)); ctx.restore();
      kit.drawText(ctx, label, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: yLabel, align: 'center', color: pal.grey,
        each: (w, i, box, c) => M.bloom(c, span(t, at + 0.6 + i * T.dur.step, at + 0.6 + i * T.dur.step + T.dur.in), out, pal.ink, label.size) });
    },
  };
}
