// A count in light: the numeral rolls up to its value, faint, while a cloud of points spirals in and lands exactly on the shape of
// the final number; as it lands the number kindles whole. The label gathers under it in a dimmer light and may take two rows.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const fin = text(S.value);
  let size = T.size.count; while (kit.numberWidth(fin, size, 800, 1) > 820 && size > 120) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: 800, minPx: T.minPx, where: 'the count label' });
  const block = size * 1.1 + 40 + label.height, top = kit.place(block, 720);
  const yNum = top + size * 0.55, yLabel = top + size * 1.1 + 40 + label.lead / 2, w = kit.numberWidth(fin, size, 800, 1);
  const NB = { x0: W / 2 - w / 2, x1: W / 2 + w / 2, y0: yNum - size * 0.6, y1: yNum + size * 0.6 };
  const NUM = M.lightPicture((g, c) => kit.number(g, fin, { x: W / 2, y: yNum, size, weight: 800, color: c, align: 'center' }), NB, { color: pal.glow, gap: 8, seed: 21, glow: 40 });
  const LB = M.lightText(kit, label, { x0: W / 2 - 400, x1: W / 2 + 400, y: yLabel, color: pal.lead, key: pal.key, gap: T.gap.small, seed: 22 });
  const roll = 1.35, t1 = d - T.dur.out - 0.1;
  const wNum = () => ({ t0: at, g: roll, t1, q: T.dur.out }), wLab = (i) => ({ t0: at + roll * 0.55 + i * 0.08, g: 0.6, t1, q: T.dur.out });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, at, at + roll), lit = M.S(span(t, at + roll * 0.92, at + roll + 0.12));
      if (p > 0 && lit < 1) {
        const v = countValue(0, S.value, Math.round(ease.outQuart(p) * 30) / 30, (x) => x);
        ctx.save(); ctx.globalAlpha = (0.25 + 0.4 * p) * (1 - lit); ctx.shadowColor = rgba(pal.glow, 0.5); ctx.shadowBlur = 24;
        kit.number(ctx, text(v), { x: W / 2, y: yNum, size, weight: 800, color: pal.glow, align: 'center', settle: p, decor: true }); ctx.restore();
      }
      M.drawLight(ctx, NUM, t, wNum, { rest: T.tone.dotRest, kindleFrom: 0.92 });
      M.drawLight(ctx, LB, t, wLab, { rest: T.tone.dotRest * 0.7 });
      if (p > 0) kit.rec(NB.x0, NB.x1, NB.y0, NB.y1, fin);
      kit.drawText(ctx, label, { x0: W / 2 - 400, x1: W / 2 + 400, y: yLabel, each: () => false });
    },
  };
}
