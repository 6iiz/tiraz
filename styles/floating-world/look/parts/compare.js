// Before and after as two cartouches. The old value unrolls first, in a soft ink; then a band of mist drifts in from the reading side
// and settles over it, so the old value sinks into the haze (still faintly there, as distance is drawn in a print). The new value unrolls
// below on a field of the accent, in the ink that reads on it, its colour block landing a little off register and settling.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const full = SAFE.right - SAFE.left, padX = T.pad.x, padY = T.pad.y + 6;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: full - 2 * padX, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full, single: true, where: 'the compare label' }) : null;
  const bw = Math.min(full, Math.max(was.width, now.width) + 2 * padX + 80), hw = was.height + 2 * padY, hn = now.height + 2 * padY;
  const lh = label ? label.lead + 26 : 0, gap = 64;
  const top = kit.place(lh + hw + gap + hn, 720), bx = (W - bw) / 2, yW = top + lh, yN = yW + hw + gap;
  const tWas = at + 0.1, tMist = at + 0.85, tNow = at + 1.35, out0 = d - T.dur.roll;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d);
      if (label) M.scroll(ctx, span(t, at, at + T.dur.lead), q, bx, top, bw, label.lead, rtl, P,
        () => kit.drawText(ctx, label, { x0: bx, x1: bx + bw, y: top + label.lead / 2, align: 'start', color: P.soft }), false);
      M.scroll(ctx, span(t, tWas, tWas + T.dur.unroll * 0.8), q, bx, yW, bw, hw, rtl, P, () => {
        M.cartouche(ctx, bx, yW, bw, hw, P);
        kit.drawText(ctx, was, { x0: bx + padX, x1: bx + bw - padX, y: yW + padY + was.lead / 2, color: P.soft, key: P.soft });
      });
      // the mist: slides in from the reading side and comes to rest over the old value
      const pm = M.E(span(t, tMist, tMist + 0.55)) * (1 - M.OUT(q));
      if (pm > 0) {
        const w = bw + 260, x = rtl ? bx - 130 + (1 - pm) * (W - bx + 130) : bx - 130 - (1 - pm) * (bx - 130 + w);
        M.mist(ctx, x, yW + hw / 2, w, hw * 0.78, P.mist, 0.86);
        M.mist(ctx, x + 60, yW + hw / 2 - hw * 0.22, w - 120, 10, P.paper, 0.9);
      }
      const reg = 1 + 2.5 * (1 - M.E(span(t, tNow + 0.25, tNow + T.dur.unroll + 0.2)));
      M.scroll(ctx, span(t, tNow, tNow + T.dur.unroll), q, bx, yN, bw, hn, rtl, P, () => {
        ctx.fillStyle = P.paper; ctx.fillRect(bx, yN, bw, hn);
        const g = ctx.createLinearGradient(0, yN, 0, yN + hn); g.addColorStop(0, P.accent); g.addColorStop(1, P.pale);
        ctx.fillStyle = g; ctx.fillRect(bx + 14 + T.reg.x * reg, yN + 14 + T.reg.y * reg, bw - 28, hn - 28);
        M.cartouche(ctx, bx, yN, bw, hn, 'rgba(0,0,0,0)');
        kit.drawText(ctx, now, { x0: bx + padX, x1: bx + bw - padX, y: yN + padY + now.lead / 2, color: P.on, key: P.on });
      });
    },
  };
}
