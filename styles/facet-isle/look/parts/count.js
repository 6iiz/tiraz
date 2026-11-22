// A number: the island's centre column grows into a tall accent pillar (its six neighbours rising part of the way) in four bounced steps, and the numeral above it counts in step
// with it, landing on the value as the pillar lands its last step. The label drops in under the numeral. At the end the numeral lifts
// off and the pillar sinks back into the island. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > SAFE.right - SAFE.left && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minPx: 44, where: 'the count label' });
  const yNum = 470, yLabel = yNum + size * 0.62 + 30 + label.lead / 2;
  const h0 = ground.centreH, top = (yLabel + label.height - label.lead / 2 + 70);
  const hMax = Math.max(h0 + 2, (T.isle.y - top) / (T.isle.scale * 0.866) - 0.6);
  const ring = ground.tiles.filter((u) => u.d === 1).map((u, k) => ({ ...u, k, top: Math.max(u.h, 2.2 + (k % 3) * 0.7) }));
  const ringC = M.palette(brand).tone(P.accent, -0.2);
  const stepped = (p, n = 4) => { p = Math.max(0, Math.min(1, p)) * n; const i = Math.floor(p); return i >= n ? 1 : (i + M.B(p - i)) / n; };
  return {
    duration: d,
    draw(ctx, t) {
      const out = span(t, d - T.dur.out, d), p = stepped(span(t, at, at + 1.6));
      const h = (h0 + (hMax - h0) * p) * (1 - M.I(out)) + h0 * M.I(out);
      const cols = [{ faces: M.prismY(ground.hex, 0, Math.max(h0, h)), color: P.accent, at: [0, 0, 0], mid: h / 2 }];
      for (const u of ring) {                              // the six neighbours rise part of the way, one after another
        const q = M.B(span(t, at + 0.2 + u.k * 0.12, at + 0.7 + u.k * 0.12)) * (1 - M.I(out)), hh = u.h + (u.top - u.h) * q;
        cols.push({ faces: M.prismY(ground.hex, 0, hh), color: ringC, at: u.at, mid: hh / 2 });
      }
      ground.draw(ctx, t, cols);
      ctx.save();
      if (M.drop(ctx, span(t, at, at + T.dur.in), 60) !== false && M.lift(ctx, out) !== false)
        kit.number(ctx, text(countValue(0, S.value, p, (x) => x)), { x: W / 2, y: yNum, size, color: P.text, align: 'center', settle: Math.min(1, p) });
      ctx.restore();
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: P.muted,
        each: (w, i, box, c) => { const t0 = at + 0.3 + i * 0.06; if (M.drop(c, span(t, t0, t0 + T.dur.in), 50) === false) return false; if (M.lift(c, out) === false) return false; } });
    },
  };
}
