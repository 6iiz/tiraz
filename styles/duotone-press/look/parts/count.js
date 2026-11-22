// A number: the leaf is pulled off a still life printed in duotone; under the photograph the numeral is printed in the dark ink and
// runs up to its value as the ink takes, slowing as it lands; the label is printed under a rule. spec: { duration, at?, decimals?,
// says: { value, label, prefix?, suffix? } }
import { need, span, ease, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = (spec.at ?? 0) - look.tokens.dur.pre,  // the pull starts under the joint, so a cut never shows a blank sheet
        d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.88, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 110) size -= 8;
  const block = size * 1.02 + 30 + label.height, top = Math.max(T.photo.y + 330 + 40, kit.place(block, 1040));
  const win = { x: SAFE.left, y: T.photo.y, w: maxW, h: top - 40 - T.photo.y };
  const yNum = top + size * 0.51, yRule = top + size * 1.02 + 6, yLabel = yRule + 24 + label.lead / 2;
  const ph = M.photo('still', Math.round(win.w * T.photo.res), Math.round(win.h * T.photo.res), 41);
  const rich = M.print(ph, ground.LUT.rich);
  const pl = M.peel({ x: SAFE.left - 20, y: win.y - 20, w: win.w + 40, h: yLabel + label.height - win.y + 30 }, rtl);
  const tNum = M.reach(pl, at, T.dur.peel, rtl ? SAFE.right - 100 : SAFE.left + 100, yNum);
  const tRule = M.reach(pl, at, T.dur.peel, rtl ? SAFE.right : SAFE.left, yRule);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const s = M.pull(pl, t, at, T.dur.peel);
      ctx.save(); pl.clip(ctx, s); M.framed(ctx, rich, win, T.photo.push * span(t, at, d));
      ctx.fillStyle = P.accent; ctx.fillRect(SAFE.left, yRule, maxW, 6);
      ctx.restore();
      if (t >= tNum) {
        const p = span(t, tNum, tNum + T.dur.count);
        ctx.save(); ctx.globalAlpha = span(t, tNum, tNum + T.dur.set);
        kit.number(ctx, text(countValue(0, S.value, p, ease.outCubic)), { x: rtl ? SAFE.right : SAFE.left, y: yNum, size, color: P.ink, align: rtl ? 'right' : 'left', settle: p });
        ctx.restore();
      }
      M.press(ctx, kit, label, { t, pl, t0: at, dur: T.dur.peel, P, T, x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.grey });
      pl.flap(ctx, s, P.back);
    },
  };
}
