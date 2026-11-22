// Before and after as two captions: the old value is slammed on, then a thick bar of the accent is slammed across it and it steps back
// to the quiet colour; the new value is slammed on under it, whole, on a block of the accent. The label is a chip above.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: maxW - 60, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.chip, weight: 700, maxW: maxW - 60, single: true, where: 'the compare label' }) : null;
  const chipH = label ? label.size * 1.5 + 40 : 0, gapY = 70;
  const top = kit.place(chipH + was.height + gapY + now.height + 40, 860);
  const yWas = top + chipH + was.lead / 2, yNow = top + chipH + was.height + gapY + now.lead / 2 + 20;
  const tWas = at + 0.2, tCut = at + 0.75, tNow = at + 1.15, pad = 30;
  const bx = rtl ? SAFE.right - now.width - pad : SAFE.left - 10, bw = now.width + pad + 10;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, top);
      if (label) M.chip(kit, ctx, label, { y: top + label.size * 0.75, p: span(t, at, at + T.dur.chip), P, rtl });
      M.caption(kit, ctx, was, { y: yWas, t, t0: tWas, gap: 0, P, T, dim: 0.85 * span(t, tCut, tCut + 0.1) });
      const k = M.E(span(t, tCut, tCut + 0.1));
      if (k > 0) {
        const L = (was.width + 60) * k, x0 = rtl ? SAFE.right + 10 : SAFE.left - 10;
        ctx.save(); ctx.translate(x0, yWas); ctx.rotate(rtl ? 0.05 : -0.05); ctx.fillStyle = P.accent; ctx.fillRect(rtl ? -L : 0, -11, L, 22); ctx.restore();
      }
      // the new value on its block: the block lands with the words
      const pn = span(t, tNow, tNow + T.dur.slam);
      if (pn > 0) {
        ctx.save();
        M.slam(ctx, pn, bx + bw / 2, yNow, T);
        ctx.fillStyle = P.accent; ctx.fillRect(bx, yNow - now.lead / 2 - 6, bw, now.height + 12);
        kit.drawText(ctx, now, { x0: SAFE.left + (rtl ? 0 : 10), x1: SAFE.right - (rtl ? 10 : 0), y: yNow, align: 'start', color: P.onAccent, key: P.onAccent });
        ctx.restore();
      }
    },
  };
}
