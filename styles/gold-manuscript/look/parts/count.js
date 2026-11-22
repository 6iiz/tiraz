// A number in a gilded roundel. The vellum disc is painted (ink circle, vellum, pearls round its edge); then a ring of gold leaf is
// laid round it square by square, clockwise from the top, keeping pace with the figure as it counts up in ink at the centre. When the
// count lands the ring closes and a light runs round the leaf. The label is written on a painted panel below.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, mix, clamp, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2;
  const R = 250, R2 = 300, N = 40;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > (R - 40) * 2 && size > 90) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 160, where: 'the count label' });
  const lw = Math.min(SAFE.right - SAFE.left + 30, label.width + 150), lh = label.height + 90;
  const top = kit.place(R2 * 2 + 60 + lh, 720), cy = top + R2, ly = top + R2 * 2 + 60;
  const lo = { x0: cx - label.width / 2, x1: cx + label.width / 2, y: ly + 45 + label.lead / 2, align: 'center' };
  const lb = M.boxesOf(kit, label, lo); let lt = at + 0.9; const lwhen = lb.map((b) => { const t0 = lt; lt += b.width / T.pen + 0.04; return t0; });
  const tiles = []; { let s = 977; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) tiles.push({ a0: (i / N) * Math.PI * 2 - Math.PI / 2, a1: ((i + 1) / N) * Math.PI * 2 - Math.PI / 2 + 0.004, tone: r(), flash: r(), broke: r() < 0.05 }); }
  const disc = (c) => { c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); };
  const pearls = Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * (R - 20), cy + Math.sin(a) * (R - 20)]; });
  const tCount = at + 0.45, tLand = at + 1.9;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d), p = span(t, tCount, tLand);
      ctx.save(); ctx.globalAlpha = 1 - out;
      M.painted(ctx, span(t, at - 0.05, at + 0.6), disc, Math.PI * 2 * R, pal, { pearls });
      // the leaf ring, laid with the count, then a light running round it
      const run = t > tLand ? ((t - tLand) / 1.4) % 1.6 : -1;
      tiles.forEach((s, i) => {
        const q = clamp((p * N - i) / 1.5); if (q <= 0) return;
        const mid = (i + 0.5) / N; let lit = run >= 0 ? Math.max(0, 1 - Math.abs(mid - run) * 6) * (0.5 + 0.5 * s.flash) : 0;
        const col = s.broke ? pal.bole : mix(mix(pal.leafLo, pal.leaf, 0.45 + s.tone * 0.55), pal.leafHi, lit);
        const r1 = R + 6, r2 = R2 - 8 + (1 - M.S(q)) * 18;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r2, s.a0, s.a1); ctx.arc(cx, cy, r1, s.a1, s.a0, true); ctx.closePath(); ctx.fill();
      });
      if (p > 0) {
        ctx.strokeStyle = pal.ink; ctx.lineWidth = 4;
        const a = -Math.PI / 2, e = a + Math.PI * 2 * Math.min(1, p * 1.03);
        ctx.beginPath(); ctx.arc(cx, cy, R2 - 6, a, e); ctx.stroke();
        ctx.fillStyle = pal.ink; for (let i = 0; i < N; i++) if (i / N < p) { ctx.save(); ctx.globalAlpha *= 0.4; const aa = tiles[i].a0; ctx.beginPath(); ctx.moveTo(cx + Math.cos(aa) * (R + 6), cy + Math.sin(aa) * (R + 6)); ctx.lineTo(cx + Math.cos(aa) * (R2 - 8), cy + Math.sin(aa) * (R2 - 8)); ctx.strokeStyle = pal.leafLo; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      }
      if (t >= tCount) {
        const str = text(countValue(0, S.value, p, M.S));
        kit.number(ctx, str, { x: cx, y: cy + size * 0.04, size, weight: 800, color: pal.ink, settle: p });
      }
      M.painted(ctx, span(t, at + 0.4, at + 1.0), (c) => M.panelPath(c, cx - lw / 2, ly, lw, lh, 26), (lw + lh) * 2, pal,
        { inset: (c) => M.panelPath(c, cx - lw / 2 + 11, ly + 11, lw - 22, lh - 22, 16) });
      kit.drawText(ctx, label, { ...lo, color: pal.ink, key: pal.rubric, each: (w, i, box, c) => M.pen(c, span(t, lwhen[i], lwhen[i] + box.width / T.pen), box, label.size, kit.rtl) });
      ctx.restore();
    },
  };
}
