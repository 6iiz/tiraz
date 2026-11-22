// A number inside a glass ring: a thick ring of clear glass floats tilted in the studio, the number set in the light colour at its
// centre. As the number counts, a comet of the accent runs round inside the ring and leaves the travelled arc softly lit; when the count
// lands the comet closes the circle and the caustic on the floor brightens. The label sits under the ring.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minPx: 44, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const R = 300, cx = W / 2, cy = 640, tilt = 0.86;
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 600, 1) > R * 1.4 && size > 100) size -= 8;
  const yLabel = cy + R * tilt + 110 + label.lead / 2;
  const t0 = at + 0.25, t1 = at + 1.6;
  const ellipse = (ctx, r, a0 = 0, a1 = Math.PI * 2) => { ctx.beginPath(); ctx.ellipse(cx, cy, r, r * tilt, -0.06, a0, a1); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, p = span(t, t0, t1), e = M.IO(p), done = span(t, t1, t1 + 0.6);
      // the ring's glass: faint body between two rims, the sweep seen through it
      ctx.save(); ellipse(ctx, R + 38); ellipse(ctx, R - 38); ctx.fillStyle = P.a(P.light, 0.05); ctx.fill('evenodd');
      const sx = ground.sweep(t);
      if (sx !== null) { ctx.save(); ellipse(ctx, R + 38); ellipse(ctx, R - 38); ctx.clip('evenodd'); const g = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0);
        g.addColorStop(0, P.a(P.light, 0)); g.addColorStop(0.5, P.a(P.light, 0.4)); g.addColorStop(1, P.a(P.light, 0)); ctx.fillStyle = g; ctx.fillRect(sx - 90, 0, 180, H); ctx.restore(); }
      // the lit arc and the comet
      const start = -Math.PI / 2, a = start + e * Math.PI * 2;
      ctx.lineCap = 'round';
      if (e > 0) { ctx.strokeStyle = P.a(P.accent, 0.35 + 0.3 * done); ctx.lineWidth = 10; ellipse(ctx, R, start, a); ctx.stroke(); }
      if (p > 0 && done < 1) for (let i = 0; i < 12; i++) {
        const k = (1 - i / 12) * (1 - done); ctx.strokeStyle = i < 2 ? P.a(P.glow, k) : P.a(P.accent, k); ctx.lineWidth = 16 - i;
        ellipse(ctx, R, a - 0.06 * (i + 1), a - 0.06 * i); ctx.stroke();
      }
      // rims: dispersion split, then the white lines
      for (const r of [R + 38, R - 38]) {
        ctx.lineWidth = 2.2; ctx.strokeStyle = P.a(P.accent, 0.7); ctx.save(); ctx.translate(2.5, 1); ellipse(ctx, r); ctx.stroke(); ctx.restore();
        ctx.strokeStyle = P.a(P.light, r > R ? 0.9 : 0.55); ctx.lineWidth = 2; ellipse(ctx, r); ctx.stroke();
      }
      ctx.restore();
      kit.number(ctx, text(countValue(0, S.value, p)), { x: cx, y: cy, size, weight: 600, color: P.light, align: 'center', settle: p });
      kit.drawText(ctx, label, { x0, x1, y: yLabel, color: P.grey, each: (w, i, box, c) => { const s = at + 0.1 + i * 0.05; if (M.arrive(c, span(t, s, s + T.dur.in), box, label.size) === false) return false; } });
      void time;
    },
  };
}
