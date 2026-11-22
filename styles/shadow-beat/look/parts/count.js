// A number as a silhouette: a giant black numeral on the sky that changes on every beat, a new value per pose, and lands on its value
// as a black bar is laid under it; on the landing the dancers freeze. The label sits under the bar. spec: { duration, at?, decimals?,
// says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > x1 - x0 && size > 120) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minScale: 0.9, minPx: 44, where: 'the count label' });
  const top = kit.place(size * 1.15 + 50 + label.height, 620), yNum = top + size * 0.55, yBar = top + size * 1.12, yLab = yBar + 40 + label.lead / 2;
  const steps = 4, sAt = (k) => at + 0.1 + k * (T.beat / 2), land = sAt(steps - 1);
  const freeze = [land, land + T.dur.freeze];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { freeze });
      if (t < sAt(0)) return;
      const down = M.sink(span(t, d - T.dur.out, d)) * 800;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, T.horizon); ctx.clip(); ctx.translate(0, down);
      let k = 0; for (let i = 0; i < steps; i++) if (t >= sAt(i)) k = i;
      const v = k >= steps - 1 ? S.value : countValue(0, S.value, (k + 1) / steps, (x) => x);
      const s = M.snap(t, sAt(k), T.dur.snap);
      ctx.save(); ctx.translate(W / 2, yNum); ctx.scale(s, s); ctx.translate(-W / 2, -yNum);
      kit.number(ctx, text(v), { x: W / 2, y: yNum, size, color: pal.ink, align: 'center', settle: 1 });
      ctx.restore();
      const bw = Math.min(x1 - x0, kit.numberWidth(text(S.value), size, 900, 1) + 80) * (t >= land ? 1 : 0);
      if (bw > 0) { ctx.fillStyle = pal.ink; ctx.fillRect(W / 2 - bw / 2, yBar - 6, bw, 12); }
      if (t >= at + 0.25) kit.drawText(ctx, label, { x0, x1, y: yLab, align: 'center', color: pal.ink });
      ctx.restore();
    },
  };
}
