// A number in a pool of colour: a round bloom of the pigment spreads out on the wet paper from its centre, with a darker rim where the
// pigment pools; the figure develops on it and climbs to its value; when it lands, drops are flicked round the pool. The label is
// painted underneath on a pale band, word by word as the brush passes. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > 700 && size > 110) size -= 8;
  const numW = kit.numberWidth(text(S.value), size, 800, 1);
  const x0 = SAFE.left + 30, x1 = SAFE.right - 30;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0 - 40, minScale: 0.8, where: 'the count label' });
  const R = Math.min(420, Math.max(size * 0.72, numW / 2 + 60));
  const top = kit.place(R * 2 + 80 + label.height, 680), cx = W / 2, cy = top + R, yLabel = cy + R + 80 + label.lead / 2;
  const pool = M.bloomSprite(R, pal.accent, 0.62, 21);
  const numInk = pal.on(pal.tint(0.6));
  const D = M.drops(91, 14, cx, cy, R * 1.45);
  const lb = M.boxes(label, { x0, x1, y: yLabel, rtl });
  const bands = label.rows.map((row, r) => {
    const b0 = lb.find((b) => b.row === r), w = row.width + label.size * 0.8, x = b0.left - label.size * 0.4, t0 = at + 0.55 + r * 0.35;
    return { B: M.band(w, label.size * 1.4, pal.accent, T.tone.band * 0.8, 50 + r, rtl), x, w, y: yLabel + r * label.lead, t0, t1: t0 + T.dur.pass };
  });
  const wordT = lb.map((b) => { const B = bands[b.row]; return M.passTime(b, B.x, B.x + B.w, B.t0, B.t1, rtl); });
  const tLand = at + 1.45, grey = pal.quiet(T.tone.grey);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      const pb = M.E(span(t, at, at + 0.7));
      if (pb > 0) {
        const s = (0.35 + 0.65 * pb), sz = pool.cv.width * s;
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = Math.min(1, pb * 2) * keep;
        ctx.drawImage(pool.cv, cx - sz / 2, cy - sz / 2, sz, sz); ctx.restore();
      }
      M.splash(ctx, D, span(t, tLand - 0.02, tLand + 0.3) * keep, pal.accent);
      const p = span(t, at + 0.3, tLand), q = span(t, at + 0.3, at + 0.3 + T.dur.dry);
      if (q > 0 && keep > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, q * 2.5) * keep;
        kit.number(ctx, text(countValue(0, S.value, p, M.E)), { x: cx, y: cy + size * 0.04, size, weight: 800, color: mix(pal.wet, numInk, M.E(q)), settle: p });
        ctx.restore();
      }
      for (const B of bands) M.lay(ctx, B.B, B.x, B.y, M.BR(span(t, B.t0, B.t1)), rtl, keep);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, color: grey,
        each: (w, i, box, c) => M.develop(c, span(t, wordT[i], wordT[i] + T.dur.dry), out, pal.wet, grey) });
    },
  };
}
