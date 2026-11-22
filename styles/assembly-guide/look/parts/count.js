// A number as the manual's parts call-out: a rounded box is ruled around the page, the part drops into it on the reading side's far
// end, and the count climbs beside it in a few clean steps ("6×" when the number is a plain count). The label slides in under the
// box; the build grows below. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, SAFE, countValue } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K, n = M.nextStep(clock), R = M.rig(W, T, K);
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const plain = S.prefix == null && S.suffix == null;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '') + (plain ? '×' : '');
  const icon = 230, room = maxW - icon - 90;
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const bx0 = x0, bx1 = x1, by0 = 440, by1 = 440 + Math.max(300, size * 1.25), yNum = (by0 + by1) / 2;
  const yLabel = by1 + 70 + label.lead / 2;
  const ix = rtl ? bx0 + 40 : bx1 - 40 - icon, iy = yNum;
  const V = M.view(ix + icon / 2, iy + 8, 100);
  const drop = at + 0.35, drop2 = Math.max(at + 0.5, 0.3);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.stepNumber(ctx, kit, n, rtl ? x1 : x0, 330, T.size.step * 0.8, K.ink, (t - at) / 0.3, rtl);
      // the call-out box, ruled from its corner
      const pb = M.E(M.clamp((t - at) / 0.35));
      if (pb > 0) {
        ctx.save(); ctx.strokeStyle = K.ink; ctx.lineWidth = 4; ctx.fillStyle = K.paper;
        ctx.beginPath(); ctx.roundRect(bx0, by0, bx1 - bx0, by1 - by0, 26); ctx.fill();
        ctx.setLineDash([2 * (bx1 - bx0 + by1 - by0) * pb, 4000]); ctx.stroke(); ctx.restore();
      }
      // the part in the box: drops in along a dotted guide, clicks, turns white
      const p = M.clamp((t - drop) / 0.4), fit = M.clamp((t - drop - 0.8) / 0.25);
      if (p > 0) {
        const lift = (1 - M.E(p)) * 2.2;
        if (p < 1) { const [a, b] = V(0.5, 1.2 + lift, 0.5), [c2, d2] = V(0.5, 4, 0.5); M.dotted(ctx, a, b, c2, d2, K.ink, 0.7); }
        M.box(ctx, V, 0, lift, 0, 1, 1.1, 1, M.fills(K, fit), T.lw);
        const [lx, ly] = V(1, 0, 0.5); M.click(ctx, lx + 6, ly - 4, (t - drop - 0.4) / 0.6, K.ink, 1);
      }
      // the count, in steps
      const pc = M.clamp((t - at - 0.3) / 0.7), v = countValue(0, S.value, Math.floor(pc * 6) / 6, (x) => x);
      if (pc > 0) kit.number(ctx, text(pc >= 1 ? S.value : v), { x: rtl ? bx1 - 50 : bx0 + 50, y: yNum, size, color: K.ink, align: rtl ? 'right' : 'left', settle: pc >= 1 ? 1 : 0 });
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: K.grey, each: (w, i, b, c) => M.arrive(c, (t - at - 0.6 - i * 0.07) / 0.3, rtl, label.size) });
      R.draw(ctx, n, t, drop2);
    },
  };
}
