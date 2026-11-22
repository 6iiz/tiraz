// A number in a lit medallion: a lacquer disc with a double engraved ring is drawn on from the top, both ways at once; a ring of bulbs
// lights pair by pair from the top down both sides as the figure, cast in the metal, counts up in its centre. When the count lands the
// last bulb meets the first at the foot, a star flares on the figure and a slow chase runs round the ring. The label sits on a plate
// that opens from the axis below. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, B = M.bulbs(pal);
  const cx = W / 2, R = 270, N = 28;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > (R - 70) * 2 && size > 90) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 140, where: 'the count label' });
  const lw = Math.min(SAFE.right - SAFE.left + 40, label.width + 130), lh = label.height + 64;
  const top = kit.place(R * 2 + 70 + lh, 700), cy = top + R, yPlate = top + R * 2 + 70 + lh / 2;
  const tCount = at + 0.35, tLand = at + 1.9, out0 = d - T.dur.out;
  const ring = (c, r, p) => { const a = Math.PI * p; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2 - a, -Math.PI / 2 + a); };
  const lo = { x0: cx - label.width / 2, x1: cx + label.width / 2, y: yPlate - label.height / 2 + label.lead / 2, align: 'center' };
  const { rank } = M.centreOut(kit, label, lo);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, out0, d), keep = 1 - M.E(out), sh = M.sheenAt(time, 3);
      const pr = M.E(span(t, at, at + 0.45)) * keep;
      if (pr > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, pr * 1.5);
        ctx.fillStyle = pal.lacquer; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        const paint = M.metal(ctx, cx - R, cy - R, cx + R, cy + R, pal, sh);
        M.gline(ctx, (c) => ring(c, R, pr), 3.2, pal, paint);
        M.gline(ctx, (c) => ring(c, R - 50, pr), 1.6, pal, paint);
        M.gline(ctx, (c) => ring(c, R - 62, pr), 1, pal, paint);
      }
      const p = span(t, tCount, tLand), lit = p * (N / 2);                    // bulbs light pair by pair from the top
      if (pr > 0.2) for (let k = 0; k < N; k++) {
        const j = k <= N / 2 ? k : N - k;                                         // its step from the top (both sides share a step)
        let lvl = M.ignite((lit - j + 1) * 1.2) * keep;
        if (t > tLand + 0.3) lvl *= 0.78 + 0.22 * Math.cos((k / N) * Math.PI * 2 - (t - tLand) * 4);   // the chase
        const a = -Math.PI / 2 + (k / N) * Math.PI * 2;
        B.draw(ctx, cx + Math.cos(a) * (R - 25), cy + Math.sin(a) * (R - 25), lvl * Math.min(1, pr * 2), 6.5);
      }
      if (t >= tCount && keep > 0) {
        ctx.save(); ctx.globalAlpha = keep;
        const str = text(countValue(0, S.value, p, M.L)), w = kit.numberWidth(str, size, 900, p);
        const paint = M.metal(ctx, cx - w / 2, cy - size / 2, cx + w / 2, cy + size / 2, pal, M.sheenAt(time, 2.4), true);
        kit.number(ctx, str, { x: cx, y: cy + size * 0.04, size, color: paint, settle: p });
        ctx.restore();
        M.sparkle(ctx, cx + w / 2 + 18, cy - size * 0.5, size * 0.24, M.flare(t, tLand) * keep, pal);
      }
      const op = M.opening(span(t, at + 0.5, at + 0.5 + T.dur.open), out);
      M.plate(ctx, cx, yPlate, lw, lh, pal, { ...op, sheen: sh });
      if (op.hf > 0.05) {
        ctx.save(); M.notched(ctx, cx, yPlate, lw * op.wf - 8, lh * op.hf - 8, 10); ctx.clip();
        kit.drawText(ctx, label, { ...lo, color: pal.ivory, key: pal.gold,
          each: (w, i, box, c) => { const t0 = at + 0.85 + rank[i] * T.dur.stagger; return M.rise(c, span(t, t0, t0 + T.dur.in), out, label.size); } });
        ctx.restore();
      }
    },
  };
}
