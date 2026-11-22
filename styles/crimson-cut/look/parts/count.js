// A number in a medallion: a big rosette with a solid centre snaps open from its folded wedge, and the figure counts up inside the
// centre on twelve drawings a second, landing exactly; the label is pasted under it on a deep red banner.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, R = 340, ri = R * 0.56;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > ri * 1.7 && size > 60) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 160, minScale: 0.8, single: true, where: 'the count label' });
  const bh = label.size * 1.9, bw = Math.min(maxW + 40, label.width + 160);
  const top = kit.place(R * 2 + 50 + bh, 720), cy = top + R, yLab = top + R * 2 + 50 + bh / 2;
  const rose = M.rosette(R, P.red, ri, 9), ban = M.banner(bw, bh, P.deep, 23);
  const tRun = at + 0.9, tLand = at + 1.8;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), drop = M.steps12(out) * 160;
      if (out >= 1) return;
      ctx.save(); ctx.translate(0, drop);
      M.unfold(ctx, rose, W / 2, cy, t - at, { gap: T.unfold.gap, dur: T.unfold.swing, turn: t * 0.03 });
      if (t >= tRun) {
        const p = span(M.steps12(t), tRun, tLand), k = M.paste(t, tLand) || 1;
        ctx.save(); ctx.translate(W / 2, cy); ctx.scale(k, k);
        kit.number(ctx, text(countValue(0, S.value, p, (x) => 1 - (1 - x) ** 2)), { x: 0, y: size * 0.04, size, color: P.onRed, settle: p >= 1 ? 1 : 0 });
        ctx.restore();
      }
      const kb = M.paste(t, tLand + 0.1);
      if (kb > 0) {
        M.lay(ctx, ban, W / 2, yLab, kb);
        ctx.translate(W / 2, yLab); ctx.scale(kb, kb); ctx.translate(-W / 2, -yLab);
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLab, align: 'center', color: P.onDeep, key: P.onDeep });
      }
      ctx.restore();
    },
  };
}
