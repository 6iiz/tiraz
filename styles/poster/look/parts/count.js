// A number as a poster: the figure counts up inside a turned panel of the accent that is thrown in up the diagonal; rays of paper
// burst from the panel's corner; the label runs level underneath on a band of paper, in the ground's colour.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, tilt = T.tilt;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const pw = 780, room = pw - 100;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 100) size -= 8;
  const ph = size * 1.25 + 40;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 80, minScale: 0.8, where: 'the count label' });
  const lh = label.height + 50;
  const top = kit.place(ph + 90 + lh, 700), cy = top + ph / 2 + 20, cx = W / 2 + (rtl ? 40 : -40);
  const yBand = top + ph + 110 + lh / 2;
  const corner = [cx + (rtl ? -1 : 1) * pw / 2, cy - ph / 2];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out), p = span(t, at + 0.15, at + 1.4);
      // the burst: three paper rays from the panel's far corner, out toward the top of the frame
      const pr = M.E(span(t, at + 0.25, at + 0.75)) * keep;
      if (pr > 0) {
        const base = rtl ? 226 : -46, s = rtl ? 1 : -1;
        [0, 14, 28].forEach((a, i) => M.wedge(ctx, corner[0], corner[1], base + s * a, base + s * (a + 7), 560 * pr, i === 1 ? pal.accent : pal.paper));
      }
      M.block(ctx, cx, cy, tilt, span(t, at, at + T.dur.slam), out, (off) => {
        ctx.fillStyle = pal.bg; ctx.fillRect(-pw / 2 - 12, -ph / 2 - 12, pw + 24, ph + 24);
        ctx.fillStyle = pal.accent; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
        if (off < M.SETTLE) kit.number(ctx, text(countValue(0, S.value, p, M.E)), { x: 0, y: 6, size, color: pal.onAccent, settle: p });
      });
      // the label band, level, thrown in from the other side
      const pb = M.E(span(t, at + 0.35, at + 0.35 + T.dur.slam)), ob = M.I(out);
      if (pb > 0 && ob < 1) {
        ctx.save(); ctx.translate((rtl ? -1 : 1) * ((1 - pb) - ob) * W, 0);
        ctx.fillStyle = pal.paper; ctx.fillRect(SAFE.left - 20, yBand - lh / 2, SAFE.right - SAFE.left + 40, lh);
        if (Math.abs(((1 - pb) - ob) * W) < M.SETTLE) kit.drawText(ctx, label, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: yBand - label.height / 2 + label.lead / 2, align: 'start', color: pal.onPaper });
        ctx.restore();
      }
    },
  };
}
