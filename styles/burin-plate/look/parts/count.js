// A number in an engraved roundel: two ruled circles are cut around, a ring of engine-turned lines is engraved between them, and the
// figure counts up inside, engraved in three passes as it climbs. When it lands, a wash of the accent is laid inside the roundel.
// The label is engraved below, centred, under a rule with a lozenge. To leave, the plate is wiped.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, R = 220;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > (R - 64) * 1.6 && size > 70) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 20, minScale: 0.85, where: 'the count label' });
  const top = kit.place(2 * R + 70 + label.height, 700), cx = W / 2, cy = top + R, yRule = cy + R + 36, yLabel = yRule + 34 + label.lead / 2;
  const ring = [];                                        // the engine-turned ring: a run of short swelling radial cuts that lean
  for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2, b = a + 0.12; ring.push([cx + Math.cos(a) * (R - 54), cy + Math.sin(a) * (R - 54), cx + Math.cos(b) * (R - 14), cy + Math.sin(b) * (R - 14)]); }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.wiped(ctx, span(t, d - T.dur.out, d), W, H, rtl, () => {
        M.roundel(ctx, cx, cy, R, span(t, at, at + 0.5), P, 3.5);
        M.roundel(ctx, cx, cy, R - 58, span(t, at + 0.1, at + 0.6), P, 2);
        const pr = span(t, at + 0.25, at + 0.95), n = Math.floor(ring.length * M.E(pr));
        ctx.fillStyle = P.ink; for (let i = 0; i < n; i++) { const [a, b, c2, e] = ring[i]; M.swell(ctx, a, b, c2, e, 1.8); }
        const p = span(t, at + 0.3, at + 1.5);
        if (p > 0) {
          const str = text(countValue(0, S.value, p)), bw = kit.numberWidth(str, size, 800, p), x0 = cx - bw / 2;
          ctx.save();
          if (p < 1 / 3) { const w = (bw + 16) * M.E(p * 3); ctx.beginPath(); ctx.rect(rtl ? x0 + bw + 8 - w : x0 - 8, cy - size, w, size * 2); ctx.clip(); }
          kit.number(ctx, str, { x: cx, y: cy + 4, size, weight: 800, color: M.inkFor(ctx, p, P.ink), settle: p });
          ctx.restore();
        }
        M.wash(ctx, cx, cy, R - 62, R - 66, span(t, at + 1.55, at + 1.55 + T.dur.wash), P, 41);
        M.ornament(ctx, cx, yRule, 420, span(t, at + 0.6, at + 1.1), P);
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.ink,
          each: (w, i, box, c) => M.engrave(c, span(t, at + 0.7 + i * T.dur.step, at + 0.7 + i * T.dur.step + T.dur.word), box, label.size, P.ink, rtl) });
      });
    },
  };
}
