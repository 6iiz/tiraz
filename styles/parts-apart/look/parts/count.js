// A number: the count drives the teardown. As the figure climbs, the device opens one layer at a time, and a dimension line on its
// far side grows with the stack, a tick for every part that has left its seat. The label sits under the figure on a hairline.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, M0 = T.model;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.88, minPx: 44, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 110) size -= 8;
  const yNum = 300 + size * 0.5, yRule = yNum + size * 0.58, yLabel = yRule + 28 + label.lead / 2, bottom = yLabel + label.height - label.lead / 2;
  const dev = M.makeDevice(pal, { seed: 8 }), n = dev.layers.length;
  const s = 0.8, cy = Math.max(1150, bottom + 560), cx = W / 2 + (kit.rtl ? 40 : -40);
  const run = [at + 0.1, at + 1.5], out0 = d - T.dur.out;
  const lb = M.boxes(kit, label, SAFE.left, SAFE.right, yLabel), lr = M.keyRuns(lb);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, run[0], run[1]), close = M.E(span(t, d - 0.5, d - 0.08));
      const P = M.view(M0.theta + M0.turn * t, s, cx, cy, M0.squash);
      const hs = M.heights(dev, M0.gap, (i) => M.E(span(p, (n - 1 - i) / n * 0.8, (n - 1 - i) / n * 0.8 + 0.3)) * (1 - close));
      M.drawDevice(ctx, dev, P, hs);
      // the dimension line beside the stack, on the side away from the reading side
      const side = kit.rtl ? -1 : 1, U = dev.U / 2 + 30;
      const pts = hs.map((h) => P.pt(side * U, dev.V / 2, h)), xs = Math.max(...pts.map((q) => q[0] * side)) * side + side * 36;
      const yb = pts[0][1], yt = pts[n - 1][1], vis = 1 - span(t, d - 0.6, d - 0.3);
      if (yb - yt > 8 && vis > 0) {
        ctx.save(); ctx.globalAlpha = vis; ctx.fillStyle = pal.wire;
        ctx.fillRect(xs - 1, yt, 2, yb - yt);
        for (const q of pts) ctx.fillRect(xs - 9, q[1] - 1, 18, 2);
        ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.moveTo(xs, yt - 2); ctx.lineTo(xs - 8, yt + 14); ctx.lineTo(xs + 8, yt + 14); ctx.fill();
        ctx.beginPath(); ctx.moveTo(xs, yb + 2); ctx.lineTo(xs - 8, yb - 14); ctx.lineTo(xs + 8, yb - 14); ctx.fill();
        ctx.restore();
      }
      const q = span(t, out0, d);
      ctx.save(); ctx.globalAlpha = 1 - q; ctx.translate(0, q * q * 50);
      const v = countValue(0, S.value, M.soft(p) >= 1 ? 1 : p, (x) => M.soft(x));
      if (t >= at) kit.number(ctx, text(v), { x: kit.rtl ? SAFE.right : SAFE.left, y: yNum + (1 - M.soft(span(t, at, at + 0.35))) * 40, size, color: pal.light, align: kit.rtl ? 'right' : 'left', settle: p });
      const rw = maxW * M.soft(span(t, at + 0.3, at + 0.9));
      ctx.fillStyle = pal.wire; ctx.fillRect(kit.rtl ? SAFE.right - rw : SAFE.left, yRule, rw, 2);
      ctx.fillStyle = pal.accent; ctx.fillRect(kit.rtl ? SAFE.right - 60 : SAFE.left, yRule - 3, 60 * span(t, run[1] - 0.1, run[1] + 0.1), 8);
      ctx.restore();
      lr.forEach((r) => M.bracket(ctx, r, label.size, pal.key, span(t, at + 0.7, at + 0.95) * (1 - q), kit.rtl));
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: pal.grey, key: pal.key,
        each: (w, i, box, c) => { if (M.settle(c, t, at + 0.45 + i * 0.05, T.dur.word, out0, d) === false) return false; } });
    },
  };
}
