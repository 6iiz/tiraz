// A number as an intertitle: the card opens, an oval cartouche (a double ring) is drawn around its upper half, and the figure climbs to
// its value in cranked steps (a new value each drawing, steps shrinking toward the end) until it lands; the flourish is drawn under it on
// landing and the label is exposed below an ornament rule. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, C = T.card;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const maxW = C.x1 - C.x0 - 2 * C.padX, cx = (C.x0 + C.x1) / 2;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > maxW - 120 && size > 90) size -= 6;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.8, where: 'the count label' });
  const ovH = size * 1.25, ovW = Math.min(maxW + 20, Math.max(kit.numberWidth(text(S.value), size, 800, 1) + 180, 420));
  const h = C.padY * 2 + ovH + 70 + label.height, top = kit.place(h, 720);
  const yNum = top + C.padY + ovH / 2, yRule = yNum + ovH / 2 + 34, yLabel = yRule + 36 + label.lead / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const w = ground.weave(t), tc = M.crank(t - at);
      ctx.save(); ctx.translate(w.x, w.y);
      M.card(ctx, C.x0, top, C.x1, top + h, span(tc, 0, 0.34), P, C.notch);
      const po = span(tc, 0.2, 0.6);
      if (po > 0) {                                                       // the cartouche, drawn round from the top
        ctx.save(); ctx.strokeStyle = P.silver; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.ellipse(cx, yNum, ovW / 2, ovH / 2, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * po); ctx.stroke();
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, yNum, ovW / 2 - 12, ovH / 2 - 12, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * po); ctx.stroke();
        ctx.restore();
        if (po >= 1) for (const s of [-1, 1]) M.diamond(ctx, cx + s * ovW / 2, yNum, 9, P.flourish);
      }
      const p = span(tc, 0.35, 1.45), land = span(tc, 1.45, 1.8);
      if (tc >= 0.35) {
        ctx.save(); ctx.globalAlpha = Math.min(1, span(tc, 0.35, 0.5) * 1.4);
        const wNum = kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: cx, y: yNum + size * 0.04, size, weight: 800, color: P.silver, settle: p });
        ctx.restore();
        M.flourish(ctx, cx - wNum / 2, cx + wNum / 2, yNum + size * 0.5, land, P, kit.rtl);
      }
      M.rule(ctx, cx, yRule, 420, span(tc, 0.5, 0.8), P);
      kit.drawText(ctx, label, { x0: C.x0 + C.padX, x1: C.x1 - C.padX, y: yLabel, color: P.silver, each: (wd, i, box, c) => M.expose(c, span(tc, 0.7, 0.95), label.size) });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
