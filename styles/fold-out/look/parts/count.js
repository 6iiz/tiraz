// A number: a round accent badge of cut paper pops up on its hinge with the numeral printed on it, counting up to its value; a paper
// banner with the label pops up in front of its foot a beat later.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const R = 230, text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > R * 1.55 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW: T.textW - 60, minScale: 0.85, where: 'the count label' });
  const badge = M.piece(2 * R, 2 * R, (g) => {
    M.wobble(g, Array.from({ length: 48 }, (_, k) => { const a = (k / 48) * Math.PI * 2, rr = R - 4 - 6 * (k % 2); return [R + Math.cos(a) * rr, R + Math.sin(a) * rr]; }), 1.5, 9);
    g.fillStyle = P.accent; g.fill(); g.lineWidth = 4.5; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.stroke();
    g.beginPath(); g.arc(R, R, R * 0.8, 0, Math.PI * 2); g.lineWidth = 3; g.setLineDash([14, 10]); g.stroke();
  }, P, { seed: 13 });
  const lw = Math.min(W - 90, label.width + 110), lh = label.height + 50, L = M.card(lw, lh, P.card, P, 17);
  const top = kit.place(2 * R + lh - 40, 700), bBase = top + 2 * R, lBase = bBase + lh - 40, yLabel = lBase - lh / 2, cy = top + R;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.fold(span(t, d - T.dur.out, d)), s1 = M.pop(span(t, at, at + 0.45)) * out, s2 = M.pop(span(t, at + 0.4, at + 0.85)) * M.fold(span(t, d - T.dur.out - 0.06, d - 0.06));
      M.stand(ctx, badge, W / 2, bBase, s1, (c) => {
        const p = span(t, at + 0.2, at + 1.4);
        kit.number(c, text(countValue(0, S.value, p, ease.outCubic)), { x: W / 2, y: cy + size * 0.04, size, color: P.on, align: 'center', settle: p });
      });
      M.stand(ctx, L, W / 2, lBase, s2, (c) => kit.drawText(c, label, { x0: W / 2 - lw / 2, x1: W / 2 + lw / 2, y: yLabel, align: 'center', color: P.dark }));
    },
  };
}
